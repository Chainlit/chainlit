import { Share2 } from 'lucide-react';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

import { ChainlitContext, useChatMessages } from '@chainlit/react-client';

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

interface ShareResponse {
  success: boolean;
  threadId: string;
}

export default function ShareButton() {
  const { messages, threadId } = useChatMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasBeenCopied, setHasBeenCopied] = useState(false);
  const [sharedThreadId, setSharedThreadId] = useState<string | null>(null);
  const apiClient = useContext(ChainlitContext);

  // Only show the button if there are messages
  if (!messages.length) {
    return null;
  }

  const shareLink = `${window.location.origin}/share/${
    sharedThreadId || threadId
  }`;

  const handleCopy = async () => {
    try {
      if (!hasBeenCopied) {
        // Only show loading state for initial creation
        setIsLoading(true);

        // Make the thread public
        const response = await apiClient.post(
          `/project/thread/${threadId}/share`,
          {}
        );
        const data: ShareResponse = await response.json();

        if (!data.success) {
          throw new Error('Failed to create share link');
        }

        setSharedThreadId(data.threadId);

        // Copy the link (using the new thread ID if provided)
        await navigator.clipboard.writeText(
          `${window.location.origin}/share/${data.threadId}`
        );
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsLoading(false);
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
      setIsLoading(false);
      toast.error('Failed to create share link');
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Copying...';
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
            <DialogTitle>Share public link to chat</DialogTitle>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <div className="flex items-center justify-between rounded-md border px-3 py-2">
                <span className="text-sm text-muted-foreground truncate">
                  {shareLink}
                </span>
              </div>
            </div>
            <Button onClick={handleCopy} disabled={isLoading || isCopied}>
              {getButtonText()}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
