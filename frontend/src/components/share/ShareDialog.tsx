import { useContext, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { ChainlitContext, ClientError } from '@chainlit/react-client';

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

  const shareLink = useMemo(() => {
    const id = sharedThreadId || threadId || '';
    return `${window.location.origin}/share/${id}`;
  }, [sharedThreadId, threadId]);

  const handleCopy = async () => {
    if (!threadId) return;
    try {
      if (!hasBeenCopied) {
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Translator path="threadHistory.thread.actions.share.title" />
          </DialogTitle>
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
          <Button onClick={handleCopy} disabled={!threadId || isCopying || isCopied}>
            <Translator path="threadHistory.thread.actions.share.button" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ShareDialog;
