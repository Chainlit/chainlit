import { cn } from '@/lib/utils';
import { size } from 'lodash';
import { Share2 } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  ThreadHistory,
  threadHistoryState,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Loader } from '@/components/Loader';
import ShareDialog from '@/components/share/ShareDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem
} from '@/components/ui/sidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { Translator } from '../i18n';
import ThreadOptions from './ThreadOptions';

interface ThreadListProps {
  threadHistory?: ThreadHistory;
  error?: string;
  isFetching: boolean;
  isLoadingMore: boolean;
}

export function ThreadList({
  threadHistory,
  error,
  isFetching,
  isLoadingMore
}: ThreadListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Fix: track active thread from URL params for correct highlight
  const params = useParams<{ id?: string }>();
  const activeThreadId = params?.id;
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const { threadId: currentThreadId } = useChatMessages();
  const [threadIdToDelete, setThreadIdToDelete] = useState<string>();
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const threadSharingReady = Boolean((config as any)?.threadSharing);

  const [threadIdToShare, setThreadIdToShare] = useState<string | undefined>();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);

  const handleShareThread = (threadId: string) => {
    if (!threadSharingReady) return;
    setThreadIdToShare(threadId);
    setIsShareDialogOpen(true);
  };

  type ParsedGroupLabel = {
    month: string;
    year: number;
    raw: string;
  };

  const getMonthMap = (
    locale = navigator.language
  ): { map: Record<string, number>; monthRegex: RegExp } => {
    const map: Record<string, number> = {};
    const monthNames: string[] = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(2020, i, 1);
      const long = d
        .toLocaleDateString(locale, { month: 'long' })
        .toLocaleLowerCase(locale);
      map[long] = i;
      monthNames.push(long);
    }
    const monthRegex = new RegExp(`\\b(${monthNames.join('|')})\\b`, 'i');
    return { map, monthRegex };
  };

  const { map: monthMap, monthRegex } = useMemo<{
    map: Record<string, number>;
    monthRegex: RegExp;
  }>(() => getMonthMap(), []);

  const parseGroupLabel = (label: string): ParsedGroupLabel | null => {
    const locale = navigator.language;
    const matchMonth = label.toLocaleLowerCase(locale).match(monthRegex);
    if (!matchMonth) return null;
    const month = matchMonth[0];
    const matchYear = label.match(/\d{4}/);
    if (!matchYear) return null;
    const year = Number(matchYear[0]);
    if (isNaN(year)) return null;
    return { month, year, raw: label };
  };

  const sortGroupsByDate = (a: string, b: string): number => {
    const aParsed = parseGroupLabel(a);
    const bParsed = parseGroupLabel(b);
    if (!aParsed || !bParsed) return a.localeCompare(b);
    if (aParsed.year !== bParsed.year) return bParsed.year - aParsed.year;
    const aMonth = monthMap[aParsed.month] ?? -1;
    const bMonth = monthMap[bParsed.month] ?? -1;
    return bMonth - aMonth;
  };

  const sortedTimeGroupKeys = useMemo(() => {
    if (!threadHistory?.timeGroupedThreads) return [];
    const fixedOrder = ['Today', 'Yesterday', 'Previous 7 days', 'Previous 30 days'];
    return Object.keys(threadHistory.timeGroupedThreads).sort((a, b) => {
      const aIndex = fixedOrder.indexOf(a);
      const bIndex = fixedOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return sortGroupsByDate(a, b);
    });
  }, [threadHistory?.timeGroupedThreads]);

  if (isFetching || (!threadHistory?.timeGroupedThreads && isLoadingMore)) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" className="m-3">
        {error}
      </Alert>
    );
  }

  if (!threadHistory || size(threadHistory?.timeGroupedThreads) === 0) {
    return (
      <Alert variant="info" className="m-3">
        <Translator path="threadHistory.sidebar.empty" />
      </Alert>
    );
  }

  const handleDeleteThread = async () => {
    if (!threadIdToDelete) return;
    const isDeletingActiveThread =
      threadIdToDelete === activeThreadId ||
      threadIdToDelete === idToResume ||
      threadIdToDelete === currentThreadId;
    if (isDeletingActiveThread) {
      clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    toast.promise(apiClient.deleteThread(threadIdToDelete), {
      loading: <Translator path="threadHistory.thread.actions.delete.inProgress" />,
      success: () => {
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter((t) => t.id !== threadIdToDelete)
        }));
        setThreadIdToDelete(undefined);
        if (isDeletingActiveThread) navigate('/');
        return <Translator path="threadHistory.thread.actions.delete.success" />;
      },
      error: (err) => {
        setThreadIdToDelete(undefined);
        return err instanceof ClientError ? <span>{err.message}</span> : <span>Error</span>;
      }
    });
  };

  const handleRenameThread = () => {
    if (!threadIdToRename || !threadNewName) return;
    toast.promise(apiClient.renameThread(threadIdToRename, threadNewName), {
      loading: <Translator path="threadHistory.thread.actions.rename.inProgress" />,
      success: () => {
        setThreadNewName(undefined);
        setThreadIdToRename(undefined);
        setThreadHistory((prev) => {
          const next = { ...prev, threads: prev?.threads ? [...prev.threads] : undefined };
          const threadIndex = next.threads?.findIndex((t) => t.id === threadIdToRename);
          if (typeof threadIndex === 'number' && next.threads) {
            next.threads[threadIndex] = { ...next.threads[threadIndex], name: threadNewName };
          }
          return next;
        });
        return <div><Translator path="threadHistory.thread.actions.rename.success" /></div>;
      },
      error: (err) => {
        return err instanceof ClientError ? <span>{err.message}</span> : <span></span>;
      }
    });
  };

  const getTimeGroupLabel = (group: string) => {
    const labels = {
      Today: <Translator path="threadHistory.sidebar.timeframes.today" />,
      Yesterday: <Translator path="threadHistory.sidebar.timeframes.yesterday" />,
      'Previous 7 days': <Translator path="threadHistory.sidebar.timeframes.previous7days" />,
      'Previous 30 days': <Translator path="threadHistory.sidebar.timeframes.previous30days" />
    };
    return labels[group as keyof typeof labels] || group;
  };

  return (
    <>
      {/* 1. Delete Dialog */}
      <AlertDialog
        open={!!threadIdToDelete}
        onOpenChange={() => setThreadIdToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.thread.actions.delete.title" />
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <Translator path="threadHistory.thread.actions.delete.description" />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteThread}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 2. Rename Dialog */}
      <Dialog
        open={!!threadIdToRename}
        onOpenChange={() => setThreadIdToRename(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.thread.actions.rename.title" />
            </DialogTitle>
            <DialogDescription asChild>
              <div className="text-sm text-muted-foreground">
                <Translator path="threadHistory.thread.actions.rename.description" />
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="my-6">
            <Label htmlFor="name" className="text-right mb-2 block">
              <Translator path="threadHistory.thread.actions.rename.form.name.label" />
            </Label>
            <Input
              id="name"
              required
              value={threadNewName || ''}
              onChange={(e) => setThreadNewName(e.target.value)}
              placeholder={t('threadHistory.thread.actions.rename.form.name.placeholder')}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setThreadIdToRename(undefined)}>
              <Translator path="common.actions.cancel" />
            </Button>
            <Button type="button" onClick={handleRenameThread}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. Share Dialog */}
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={(open) => {
          setIsShareDialogOpen(open);
          if (!open) setThreadIdToShare(undefined);
        }}
        threadId={threadIdToShare || null}
      />

      {/* 4. Thread list grouped by date */}
      <TooltipProvider delayDuration={300}>
        {sortedTimeGroupKeys.map((group) => {
          const items = threadHistory!.timeGroupedThreads![group];
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel className="px-2 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {getTimeGroupLabel(group)}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((thread) => {
                    const isResumed = idToResume === thread.id && !threadHistory!.currentThreadId;
                    // Fix: also check activeThreadId from URL for correct highlight
                    const isSelected =
                      isResumed ||
                      threadHistory!.currentThreadId === thread.id ||
                      activeThreadId === thread.id;
                    return (
                      <SidebarMenuItem key={thread.id} className="group/sidebar-item">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            {/* Fix: use SidebarMenuButton as Link to avoid nested <a> HTML error */}
                            <SidebarMenuButton
                              asChild
                              isActive={isSelected}
                              className="h-9 transition-colors pr-8"
                            >
                              <Link to={isResumed ? '' : `/thread/${thread.id}`}>
                                <span className="flex min-w-0 items-center gap-2">
                                  {thread.metadata?.is_shared && (
                                    <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                  )}
                                  <span className="truncate font-medium">
                                    {thread.name || <Translator path="threadHistory.thread.untitled" />}
                                  </span>
                                </span>
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            <div className="text-xs">{thread.name}</div>
                          </TooltipContent>
                        </Tooltip>

                        {/* Fix: use SidebarMenuAction instead of SidebarMenuButton to avoid invalid HTML nesting */}
                        <SidebarMenuAction asChild>
                          <ThreadOptions
                            onDelete={(e) => {
                              e?.preventDefault();
                              e?.stopPropagation();
                              setThreadIdToDelete(thread.id);
                            }}
                            onRename={(e) => {
                              e?.preventDefault();
                              e?.stopPropagation();
                              setThreadIdToRename(thread.id);
                              setThreadNewName(thread.name);
                            }}
                            onShare={
                              dataPersistence && threadSharingReady
                                ? (e) => {
                                    e?.preventDefault();
                                    e?.stopPropagation();
                                    handleShareThread(thread.id);
                                  }
                                : undefined
                            }
                            className={cn(
                              'opacity-0 group-hover/sidebar-item:opacity-100 transition-opacity',
                              isSelected && 'opacity-100'
                            )}
                          />
                        </SidebarMenuAction>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </TooltipProvider>

      {isLoadingMore && (
        <div className="flex items-center justify-center p-4">
          <Loader />
        </div>
      )}
    </>
  );
}
