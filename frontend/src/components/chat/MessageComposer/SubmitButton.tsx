import {
    useChatData,
    useChatInteract,
    useChatMessages
  } from '@chainlit/react-client';
  import { Translator } from 'components/i18n';
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from '@/components/ui/button';
import { Stop } from '@/components/icons/Stop';
import { Send } from '@/components/icons/Send';

interface SubmitButtonProps {
    disabled?: boolean;
    onSubmit: () => void;
  }
  

export default function SubmitButton({disabled, onSubmit}: SubmitButtonProps) {
    const { loading } = useChatData();
    const { firstInteraction } = useChatMessages();
    const { stopTask } = useChatInteract();

    return <TooltipProvider>
    {loading && firstInteraction ? (
        
        <Tooltip>
          <TooltipTrigger asChild>
                  <Button
                    onClick={stopTask}
                    size="icon"
                    className='rounded-full h-8 w-8'
                  >
                    <Stop className='!size-6' />
                  </Button>
                  </TooltipTrigger>
                  <TooltipContent>
            <p>
            <Translator path="components.organisms.chat.inputBox.SubmitButton.stopTask" />
   </p>
          </TooltipContent>
        </Tooltip>
    ) : 
    <Tooltip>
    <TooltipTrigger asChild>
            <Button
            disabled={disabled}
            onClick={onSubmit}
              size="icon"
              className='rounded-full h-8 w-8'
            >
              <Send className='!size-6' />
            </Button>
            </TooltipTrigger>
            <TooltipContent>
      <p>
      <Translator path="components.organisms.chat.inputBox.SubmitButton.sendMessage" />
</p>
    </TooltipContent>
  </Tooltip>
    }
            </TooltipProvider>

}