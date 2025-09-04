import { hasMessage } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { useContext, useState } from 'react';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import {
  ChainlitContext,
  sessionIdState,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { Translator } from '../i18n';

export default function ShareButton() {
  const { messages, threadId } = useChatMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const sessionId = useRecoilValue(sessionIdState);
  const [isCopying, setIsCopying] = useState(false);
  const { config } = useConfig();
  const [hasBeenCopied, setHasBeenCopied] = useState(false);
  const [sharedThreadId, setSharedThreadId] = useState<string | null>(null);
  const dataPersistence = config?.dataPersistence;
  const threadSharingReady = Boolean((config as any)?.threadSharing);
  const apiClient = useContext(ChainlitContext);

  // Only show the button if messages, persistence is on, and feature is ready
  if (!hasMessage(messages) || !dataPersistence || !threadId || !threadSharingReady)
    return null;

  const shareLink = `${window.location.origin}/share/${
    sharedThreadId || threadId
  }`;

  const handleCopy = async () => {
    try {
      if (!hasBeenCopied) {
        // Only show loading state for initial creation
        setIsCopying(true);

        // Mark thread as shared via API
  await (apiClient as any).shareThread(threadId, true);

        setSharedThreadId(threadId);

        // Copy the link
        await navigator.clipboard.writeText(shareLink);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsCopying(false);
        setHasBeenCopied(true);

        toast.success('Share link created!');
      } else {
        // Subsequent copies are instant
        await navigator.clipboard.writeText(shareLink);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to share thread:', err);
      setIsCopying(false);
      toast.error('Failed to create share link');
    }
  };

  const getButtonText = () => {
    if (isCopying) return 'Copying...';
    if (isCopied) return 'Copied';
    if (!hasBeenCopied) return 'Create link';
    return 'Copy link';
  };

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-muted-foreground"
              onClick={() => setIsOpen(true)}
            >
              <Share2 className="!size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Share</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
            <Button onClick={handleCopy} disabled={isCopying || isCopied}>
              <Translator path="threadHistory.thread.actions.share.button" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}