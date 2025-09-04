import { useContext, useMemo, useState, useCallback } from 'react';
import { toast } from 'sonner';

import {
  ChainlitContext,
  ClientError,
  threadHistoryState
} from '@chainlit/react-client';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { Translator } from '../i18n';

type ShareDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  threadId?: string | null;
};

export function ShareDialog({ open, onOpenChange, threadId }: ShareDialogProps) {
  const apiClient = useContext(ChainlitContext);
  const [isCopying, setIsCopying] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);
  const [sharedThreadId, setSharedThreadId] = useState<string | null>(null);
  const threadHistory = useRecoilValue(threadHistoryState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);

  const isAlreadyShared = useMemo(() => {
    if (!threadId) return false;
    const allThreads = threadHistory?.threads;
    if (!allThreads) return false;
    const t = allThreads.find((th) => th.id === threadId);
    return Boolean(t?.metadata?.is_shared);
  }, [threadHistory?.threads, threadId]);

  const shareLink = useMemo(() => {
    const id = sharedThreadId || threadId || '';
    return `${window.location.origin}/share/${id}`;
  }, [sharedThreadId, threadId]);

  const handleCopy = async () => {
    if (!threadId) return;
    try {
      if (!hasBeenCopied) {
        if (isAlreadyShared) {
          setSharedThreadId(threadId);
          await navigator.clipboard.writeText(shareLink);
          setHasBeenCopied(true);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
          toast.success('Link copied');
          return;
        }
        setIsCopying(true);
        if (typeof (apiClient as any)?.shareThread === 'function') {
          await (apiClient as any).shareThread(threadId, true);
        } else {
          const putRes = await (apiClient as any).put?.(`/project/thread/share`, {
            threadId,
            isShared: true
          });
          await putRes?.json?.();
        }
        setSharedThreadId(threadId);
  await navigator.clipboard.writeText(shareLink);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsCopying(false);
        setHasBeenCopied(true);
        setThreadHistory((prev) => {
          if (!prev?.threads) return prev;
          const next = { ...prev, threads: [...prev.threads] };
          const idx = next.threads.findIndex((t) => t.id === threadId);
          if (idx !== -1) {
            const md = { ...(next.threads[idx].metadata || {}) };
            md.is_shared = true;
            next.threads[idx] = { ...next.threads[idx], metadata: md } as any;
          }
          return next;
        });
        toast.success('Share link created!');
      } else {
        await navigator.clipboard.writeText(shareLink);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err: any) {
      setIsCopying(false);
      if (err instanceof ClientError) {
        // Show server-provided detail when available
        toast.error(err.toString());
      } else {
        toast.error('Failed to create share link');
      }
    }
  };

  const handleUnshare = useCallback(async () => {
    if (!threadId) return;
    try {
      setIsCopying(true);
      if (typeof (apiClient as any)?.shareThread === 'function') {
        await (apiClient as any).shareThread(threadId, false);
      } else {
        const putRes = await (apiClient as any).put?.(`/project/thread/share`, {
          threadId,
          isShared: false
        });
        await putRes?.json?.();
      }
      setThreadHistory((prev) => {
        if (!prev?.threads) return prev;
        const next = { ...prev, threads: [...prev.threads] };
        const idx = next.threads.findIndex((t) => t.id === threadId);
        if (idx !== -1) {
          const md = { ...(next.threads[idx].metadata || {}) };
          md.is_shared = false;
          if ('shared_at' in md) delete (md as any).shared_at;
          next.threads[idx] = { ...next.threads[idx], metadata: md } as any;
        }
        return next;
      });
      setIsCopying(false);
      toast.success('Sharing disabled for this thread');
      onOpenChange(false);
    } catch (err: any) {
      setIsCopying(false);
      if (err instanceof ClientError) {
        toast.error(err.toString());
      } else {
        toast.error('Failed to unshare thread');
      }
    }
  }, [apiClient, onOpenChange, setThreadHistory, threadId]);

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSharedThreadId(null);
          setIsCopying(false);
          setIsCopied(false);
          setHasBeenCopied(false);
        }
      }}
    >
  <DialogContent className="sm:max-w-lg overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            <Translator path="threadHistory.thread.actions.share.title" />
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <div className="rounded-md border px-3 py-2 w-full">
            <span
              className="text-sm text-muted-foreground overflow-hidden text-ellipsis whitespace-nowrap block"
              title={shareLink}
            >
              {shareLink}
            </span>
          </div>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleCopy} disabled={!threadId || isCopying || isCopied}>
              <Translator path="threadHistory.thread.actions.share.button" />
            </Button>
            {isAlreadyShared ? (
              <Button
                onClick={handleUnshare}
                disabled={!threadId || isCopying}
                variant="outline"
              >
                Unshare
              </Button>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
