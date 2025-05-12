import { cn } from '@/lib/utils';
import { size } from 'lodash';
import { useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  ThreadHistory,
  sessionIdState,
  threadHistoryState,
  useChatInteract,
  useChatMessages,
  useChatSession,
  useConfig
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Loader } from '@/components/Loader';
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
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const apiClient = useContext(ChainlitContext);
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const sessionId = useRecoilValue(sessionIdState);

  // Share thread state
  const [threadIdToShare, setThreadIdToShare] = useState<string | undefined>();
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);
  const [sharedThreadId, setSharedThreadId] = useState<string | null>(null);

  const shareLink = `${window.location.origin}/share/${
    sharedThreadId || threadIdToShare || ''
  }`;

  const handleShareThread = (threadId: string) => {
    setThreadIdToShare(threadId);
    setIsShareDialogOpen(true);
    setIsCopying(false);
    setIsCopied(false);
    setHasBeenCopied(false);
    setSharedThreadId(null);
  };

  const handleCopyShareLink = async () => {
    if (!threadIdToShare) return;
    try {
      if (!hasBeenCopied) {
        setIsCopying(true);
        const result = await apiClient.shareThread(threadIdToShare, sessionId);
        if (!result.success) {
          throw new Error('Failed to create share link');
        }
        setSharedThreadId(result.threadId);
        await navigator.clipboard.writeText(
          `${window.location.origin}/share/${result.threadId}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsCopying(false);
        setHasBeenCopied(true);
        toast.success('Share link created!');
      } else {
        await navigator.clipboard.writeText(shareLink);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      setIsCopying(false);
      toast.error(`Failed to create share link:${err}`);
    }
  };

  const getShareButtonText = () => {
    if (isCopying) return 'Copying...';
    if (isCopied) return 'Copied';
    if (!hasBeenCopied) return 'Create link';
    return 'Copy link';
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
      <Dialog
        open={isShareDialogOpen}
        onOpenChange={(open) => {
          setIsShareDialogOpen(open);
          if (!open) {
            setThreadIdToShare(undefined);
            setSharedThreadId(null);
            setIsCopying(false);
            setIsCopied(false);
            setHasBeenCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share public link to chat</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2 w-full">
            <div className="grid flex-1 gap-2">
              <div className="flex items-center justify-between rounded-md border px-3 py-2 w-full max-w-[250px]">
                <span
                  className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap w-full block"
                  title={shareLink}
                >
                  {shareLink}
                </span>
              </div>
            </div>
            <Button
              onClick={handleCopyShareLink}
              disabled={isCopying || isCopied}
            >
              {getShareButtonText()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <TooltipProvider delayDuration={300}>
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
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={isResumed ? '' : `/thread/${thread.id}`}>
                              <SidebarMenuButton
                                isActive={isSelected}
                                className="relative truncate h-9 group/thread"
                              >
                                {thread.name || (
                                  <Translator path="threadHistory.thread.untitled" />
                                )}
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
                                    dataPersistence
                                      ? () => handleShareThread(thread.id)
                                      : undefined
                                  }
                                  className={cn(
                                    'absolute z-20 bottom-0 top-0 right-0 bg-sidebar-accent hover:bg-sidebar-accent hover:text-primary flex opacity-0 group-hover/thread:opacity-100',
                                    isSelected &&
                                      'bg-sidebar-accent opacity-100'
                                  )}
                                />
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
