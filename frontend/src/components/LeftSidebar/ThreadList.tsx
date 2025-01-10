import { cn } from '@/lib/utils';
import { map, size } from 'lodash';
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  ThreadHistory,
  threadHistoryState,
  useChatInteract,
  useChatMessages,
  useChatSession
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
  const navigate = useNavigate();
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const { threadId: currentThreadId } = useChatMessages();
  const [threadIdToDelete, setThreadIdToDelete] = useState<string>();
  const [threadIdToRename, setThreadIdToRename] = useState<string>();
  const [threadNewName, setThreadNewName] = useState<string>();
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const apiClient = useContext(ChainlitContext);

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
        No threads found
      </Alert>
    );
  }

  const handleDeleteThread = () => {
    if (!threadIdToDelete) return;

    toast.promise(apiClient.deleteThread(threadIdToDelete), {
      loading: (
        <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.deletingChat" />
      ),
      success: () => {
        if (
          threadIdToDelete === idToResume ||
          threadIdToDelete === currentThreadId
        ) {
          clear();
        }
        if (threadIdToDelete === threadHistory.currentThreadId) {
          navigate('/');
        }
        setThreadHistory((prev) => ({
          ...prev,
          threads: prev?.threads?.filter((t) => t.id !== threadIdToDelete)
        }));
        return (
          <Translator path="components.organisms.threadHistory.sidebar.DeleteThreadButton.chatDeleted" />
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
      loading: 'Renaming thread',
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

          if (typeof threadIndex === 'number') {
            next.threads![threadIndex] = {
              ...next.threads![threadIndex],
              name: threadNewName
            };
          }
          return next;
        });
        return <div>Thread renamed!</div>;
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
      Today: 'Today',
      Yesterday: 'Yesterday',
      'Previous 7 days': 'Last 7 Days',
      'Previous 30 days': 'Last 30 Days'
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
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteThread}>
              Confirm
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
            <DialogTitle>Rename Thread</DialogTitle>
            <DialogDescription>
              Enter a new name for this thread.
            </DialogDescription>
          </DialogHeader>
          <div className="my-6">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              required
              value={threadNewName}
              onChange={(e) => {
                setThreadNewName(e.target.value);
              }}
              placeholder="Enter new name"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setThreadIdToRename(undefined)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRenameThread}>
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {map(threadHistory.timeGroupedThreads, (items, group) => (
        <SidebarGroup key={group}>
          <SidebarGroupLabel>{getTimeGroupLabel(group)}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((thread) => {
                const isResumed =
                  idToResume === thread.id && !threadHistory.currentThreadId;
                const isSelected =
                  isResumed || threadHistory.currentThreadId === thread.id;
                return (
                  <SidebarMenuItem key={thread.id} id={`thread-${thread.id}`}>
                    <Link to={isResumed ? '' : `/thread/${thread.id}`}>
                      <SidebarMenuButton
                        isActive={isSelected}
                        className="relative truncate h-9 group/thread"
                      >
                        {thread.name || 'Untitled Conversation'}
                        <div
                          className={cn(
                            'absolute w-10 bottom-0 top-0 right-0 bg-gradient-to-l from-[hsl(var(--sidebar-background))] to-transparent'
                          )}
                        />
                        <ThreadOptions
                          onDelete={() => setThreadIdToDelete(thread.id)}
                          onRename={() => {
                            setThreadIdToRename(thread.id);
                            setThreadNewName(thread.name);
                          }}
                          className={cn(
                            'absolute z-20 bottom-0 top-0 right-0 bg-sidebar-accent hover:bg-sidebar-accent hover:text-primary flex opacity-0 group-hover/thread:opacity-100',
                            isSelected && 'bg-sidebar-accent opacity-100'
                          )}
                        />
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
      {isLoadingMore ? (
        <div className="flex items-center justify-center p-2">
          <Loader />
        </div>
      ) : null}
    </>
  );
}
