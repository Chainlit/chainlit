import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquarePen } from 'lucide-react';
import { useChatInteract } from '@chainlit/react-client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type NewChatDialogProps = {
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
};

export const NewChatDialog = ({ open, handleClose, handleConfirm }: NewChatDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
          <DialogDescription>
            This will clear your current chat history. Are you sure you want to continue?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="default" onClick={handleConfirm} id="confirm">
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const NewChatButton = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { clear } = useChatInteract();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    clear();
    navigate('/');
    handleClose();
  };

  return (
    <div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              id="new-chat-button"
              className='text-muted-foreground hover:text-muted-foreground'
              onClick={handleClickOpen}
              {...props}
            >
              <SquarePen className="!size-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            New Chat
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <NewChatDialog
        open={open}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </div>
  );
};

export default NewChatButton;