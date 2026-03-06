import { cn } from '@/lib/utils';
import { size } from 'lodash';
import { Share2, Trash2 } from 'lucide-react';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  ThreadHistory, // sessionIdState,
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
import { Checkbox } from '@/components/ui/checkbox';
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
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const { threadId: currentThreadId } = useChatMessages();
  const [threadIdToDelete, setThreadIdToDelete] = useState<string>();
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [selectedThreadIds, setSelectedThreadIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const threadSharingReady = Boolean((config as any)?.threadSharing);
  // sessionId not needed here

  // Share thread state
  const [threadIdToShare, setThreadIdToShare] = useState<string | undefined>();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  // Share dialog state is centralized in ShareDialog; we only track which thread to share

  const handleShareThread = (threadId: string) => {
    if (!threadSharingReady) return;
    setThreadIdToShare(threadId);
    setIsShareDialogOpen(true);
    // ShareDialog handles its own internal state; we just open it
  };

  const sortedTimeGroupKeys = useMemo(() => {
    if (!threadHistory?.timeGroupedThreads) return [];
    const fixedOrder = [
      'Today',
      'Yesterday',
      'Previous 7 days',
      'Previous 30 days'
    ];
    return Object.keys(threadHistory.timeGroupedThreads).sort((a, b) => {
      const aIndex = fixedOrder.indexOf(a);
      const bIndex = fixedOrder.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
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
    if (
      threadIdToDelete === idToResume ||
      threadIdToDelete === currentThreadId
    ) {
      clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    toast.promise(apiClient.deleteThread(threadIdToDelete), {
      loading: (
        <Translator path="threadHistory.thread.actions.delete.inProgress" />
      ),
      success: () => {
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter((t) => t.id !== threadIdToDelete)
        }));
        navigate('/');
        return (
          <Translator path="threadHistory.thread.actions.delete.success" />
        );
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedThreadIds.length === 0) return;

    if (
      selectedThreadIds.includes(idToResume || '') ||
      selectedThreadIds.includes(currentThreadId || '')
    ) {
      clear();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    toast.promise(apiClient.deleteThreads(selectedThreadIds), {
      loading: (
        <Translator path="threadHistory.thread.actions.delete.inProgress" />
      ),
      success: () => {
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter(
            (t) => !selectedThreadIds.includes(t.id)
          )
        }));
        setSelectedThreadIds([]);
        setIsSelectionMode(false);
        navigate('/');
        return (
          <Translator path="threadHistory.thread.actions.delete.success" />
        );
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
  };

  const handleRenameThread = () => {
    if (!threadIdToRename || !threadNewName) return;

    toast.promise(apiClient.renameThread(threadIdToRename, threadNewName), {
      loading: (
        <Translator path="threadHistory.thread.actions.rename.inProgress" />
      ),
      success: () => {
        setThreadNewName(undefined);
        setThreadIdToRename(undefined);
        setThreadHistory((prev) => {
          const next = {
            ...prev,
            threads: prev?.threads ? [...prev.threads] : undefined
          };
          const threadIndex = next.threads?.findIndex(
            (t) => t.id === threadIdToRename
          );
          if (typeof threadIndex === 'number' && next.threads) {
            next.threads[threadIndex] = {
              ...next.threads[threadIndex],
              name: threadNewName
            };
          }
          return next;
        });
        return (
          <div>
            <Translator path="threadHistory.thread.actions.rename.success" />
          </div>
        );
      },
      error: (err) => {
        if (err instanceof ClientError) {
          return <span>{err.message}</span>;
        } else {
          return <span></span>;
        }
      }
    });
  };

  const getTimeGroupLabel = (group: string) => {
    const labels = {
      Today: <Translator path="threadHistory.sidebar.timeframes.today" />,
      Yesterday: (
        <Translator path="threadHistory.sidebar.timeframes.yesterday" />
      ),
      'Previous 7 days': (
        <Translator path="threadHistory.sidebar.timeframes.previous7days" />
      ),
      'Previous 30 days': (
        <Translator path="threadHistory.sidebar.timeframes.previous30days" />
      )
    };
    return labels[group as keyof typeof labels] || group;
  };

  return (
    <>
      <AlertDialog
        open={!!threadIdToDelete}
        onOpenChange={() => setThreadIdToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.thread.actions.delete.title" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              <Translator path="threadHistory.thread.actions.delete.description" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread}>
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={isDeletingSelected}
        onOpenChange={(open) => setIsDeletingSelected(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Translator path="threadHistory.thread.actions.delete.title" />
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('threadHistory.thread.actions.delete.description_plural', {
                count: selectedThreadIds.length
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">
              <Translator path="common.actions.cancel" />
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected}>
              <Translator path="common.actions.confirm" />
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={!!threadIdToRename}
        onOpenChange={() => setThreadIdToRename(undefined)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              <Translator path="threadHistory.thread.actions.rename.title" />
            </DialogTitle>
            <DialogDescription>
              <Translator path="threadHistory.thread.actions.rename.description" />
            </DialogDescription>
          </DialogHeader>
          <div className="my-6">
            <Label htmlFor="name" className="text-right">
              <Translator path="threadHistory.thread.actions.rename.form.name.label" />
            </Label>
            <Input
              id="name"
              required
              value={threadNewName}
              onChange={(e) => setThreadNewName(e.target.value)}
              placeholder={t(
                'threadHistory.thread.actions.rename.form.name.placeholder'
              )}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setThreadIdToRename(undefined)}
            >
              <Translator path="common.actions.cancel" />
            </Button>
            <Button type="button" onClick={handleRenameThread}>
              <Translator path="common.actions.confirm" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ShareDialog
        open={isShareDialogOpen}
        onOpenChange={(open) => {
          setIsShareDialogOpen(open);
          if (!open) {
            setThreadIdToShare(undefined);
          }
        }}
        threadId={threadIdToShare || null}
      />
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsSelectionMode(!isSelectionMode);
              setSelectedThreadIds([]);
            }}
            className="text-xs h-8 px-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSelectionMode ? (
              <Translator path="common.actions.cancel" />
            ) : (
              <Translator path="common.actions.select" />
            )}
          </Button>
          {isSelectionMode && (
            <div className="flex items-center gap-2">
              {selectedThreadIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDeletingSelected(true)}
                  className="text-xs h-8 px-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  <Translator path="threadHistory.thread.menu.delete" />(
                  {selectedThreadIds.length})
                </Button>
              )}
            </div>
          )}
        </div>
        {sortedTimeGroupKeys.map((group) => {
          const items = threadHistory!.timeGroupedThreads![group];
          return (
            <SidebarGroup key={group}>
              <SidebarGroupLabel>{getTimeGroupLabel(group)}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((thread) => {
                    const isResumed =
                      idToResume === thread.id &&
                      !threadHistory!.currentThreadId;
                    const isSelected =
                      isResumed || threadHistory!.currentThreadId === thread.id;
                    return (
                      <SidebarMenuItem
                        key={thread.id}
                        id={`thread-${thread.id}`}
                        className="flex items-center group/item min-w-0"
                      >
                        {isSelectionMode && (
                          <Checkbox
                            checked={selectedThreadIds.includes(thread.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedThreadIds([
                                  ...selectedThreadIds,
                                  thread.id
                                ]);
                              } else {
                                setSelectedThreadIds(
                                  selectedThreadIds.filter(
                                    (id) => id !== thread.id
                                  )
                                );
                              }
                            }}
                            className="ml-2 shrink-0 transition-opacity"
                          />
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild className="flex-grow min-w-0">
                            <Link
                              to={
                                isSelectionMode || isResumed
                                  ? ''
                                  : `/thread/${thread.id}`
                              }
                              className="min-w-0"
                              onClick={(e) => {
                                if (isSelectionMode) {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const isSelected = selectedThreadIds.includes(
                                    thread.id
                                  );
                                  if (isSelected) {
                                    setSelectedThreadIds(
                                      selectedThreadIds.filter(
                                        (id) => id !== thread.id
                                      )
                                    );
                                  } else {
                                    setSelectedThreadIds([
                                      ...selectedThreadIds,
                                      thread.id
                                    ]);
                                  }
                                }
                              }}
                            >
                              <SidebarMenuButton
                                isActive={isSelected}
                                className="relative h-9 group/thread min-w-0 pr-8"
                              >
                                <span className="flex min-w-0 items-center gap-2 flex-grow">
                                  {thread.metadata?.is_shared ? (
                                    <Share2
                                      className="h-4 w-4 shrink-0 text-muted-foreground"
                                      aria-hidden="true"
                                    />
                                  ) : null}
                                  <span className="truncate flex-grow">
                                    {thread.name || (
                                      <Translator path="threadHistory.thread.untitled" />
                                    )}
                                  </span>
                                </span>
                                {!isSelectionMode && (
                                  <>
                                    <div
                                      className={cn(
                                        'absolute w-10 bottom-0 top-0 right-0 bg-gradient-to-l from-[hsl(var(--sidebar-background))] to-transparent'
                                      )}
                                    />
                                    <ThreadOptions
                                      onDelete={() =>
                                        setThreadIdToDelete(thread.id)
                                      }
                                      onRename={() => {
                                        setThreadIdToRename(thread.id);
                                        setThreadNewName(thread.name);
                                      }}
                                      onShare={
                                        dataPersistence && threadSharingReady
                                          ? () => handleShareThread(thread.id)
                                          : undefined
                                      }
                                      className={cn(
                                        'absolute z-20 bottom-0 top-0 right-0 hover:bg-sidebar-accent hover:text-primary flex opacity-100 md:opacity-0 md:group-hover/thread:opacity-100',
                                        isSelected &&
                                          'bg-sidebar-accent opacity-100'
                                      )}
                                    />
                                  </>
                                )}
                              </SidebarMenuButton>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="center">
                            <p>{thread.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </TooltipProvider>
      {isLoadingMore ? (
        <div className="flex items-center justify-center p-2">
          <Loader />
        </div>
      ) : null}
    </>
  );
}
