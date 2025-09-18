import { hasMessage } from '@/lib/utils';
import { Share2 } from 'lucide-react';
import { useState } from 'react';
import { useChatMessages, useConfig } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import { Translator } from '../i18n';
import ShareDialog from '@/components/share/ShareDialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

export default function ShareButton() {
  const { messages, threadId } = useChatMessages();
  const [isOpen, setIsOpen] = useState(false);
  const { config } = useConfig();
  const dataPersistence = config?.dataPersistence;
  const threadSharingReady = Boolean((config as any)?.threadSharing);

  // Only show the button if messages, persistence is on, and feature is ready
  if (!hasMessage(messages) || !dataPersistence || !threadId || !threadSharingReady)
    return null;

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
            <p>
              <Translator path="threadHistory.thread.menu.share" />
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <ShareDialog open={isOpen} onOpenChange={setIsOpen} threadId={threadId} />
    </>
  );
}