import React, { useState } from 'react';

import { useChatInteract } from '@chainlit/react-client';

import { Translator } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { Plus } from "lucide-react";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  navigate?: (to: string) => void;
}

const NewChatButton = ({ navigate, ...buttonProps }: Props) => {
  const [open, setOpen] = useState(false);
  const { clear } = useChatInteract();

  const handleClickOpen = () => {
    clear()
    window.dispatchEvent(new CustomEvent('copilot-new-session'));
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              id="new-chat-button"
              onClick={handleClickOpen}
              className='text-primary hover:text-primary border border-primary'
              {...buttonProps}
            >
               <Plus className="w-4 h-4" />
               <Translator path="components.molecules.newChatButton.newChatSession" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="navigation.newChat.dialog.tooltip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default NewChatButton;
