import { useContext } from 'react';
import {
  useChatData,
  useChatInteract,
  useChatMessages
} from '@chainlit/react-client';

import { Send } from 'lucide-react';
import { Stop } from '@/components/icons/Stop';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Translator } from 'components/i18n';

import { WidgetContext } from '@chainlit/copilot/src/context';
interface SubmitButtonProps {
  disabled?: boolean;
  onSubmit: () => void;
}

export default function SubmitButton({
  disabled,
  onSubmit
}: SubmitButtonProps) {
  const { evoya } = useContext(WidgetContext);
  const { loading } = useChatData();
  const { firstInteraction } = useChatMessages();
  const { stopTask } = useChatInteract();

  return (
    <TooltipProvider>
      {loading && firstInteraction ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="stop-button"
              onClick={stopTask}
              size="icon"
              variant="outline"
              className="rounded-full h-8 w-8 hover:bg-muted"
            >
              <Stop className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="chat.input.actions.stop" />
            </p>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              id="chat-submit"
              disabled={disabled}
              onClick={onSubmit}
              size="icon"
              variant="ghost"
              className="rounded-full h-8 w-8 hover:bg-muted"
            >
              <Send className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              <Translator path="chat.input.actions.send" />
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </TooltipProvider>
  );
}
