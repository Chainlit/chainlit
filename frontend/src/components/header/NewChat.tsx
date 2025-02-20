import React, { Dispatch, SetStateAction, useState } from 'react';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import CustomChatProfileSelector from '@/components/header/CustomChatPorfileSelector';
import { Translator } from '@/components/i18n';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { EditSquare } from '../icons/EditSquare';

type NewChatDialogProps = {
  open: boolean;
  handleClose: () => void;
  handleConfirm: () => void;
  selectedChatProfile: string | undefined;
  setSelectedChatProfile: Dispatch<SetStateAction<string | undefined>>;
};

export const NewChatDialog = ({
  open,
  handleClose,
  handleConfirm,
  selectedChatProfile,
  setSelectedChatProfile
}: NewChatDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent id="new-chat-dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Translator path="navigation.newChat.dialog.title" />
          </DialogTitle>
          <DialogDescription>
            <Translator path="navigation.newChat.dialog.description" />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:gap-0">
          <CustomChatProfileSelector
            selectedChatProfile={selectedChatProfile}
            setSelectedChatProfile={setSelectedChatProfile}
          />
          <Button variant="outline" onClick={handleClose}>
            <Translator path="common.actions.cancel" />
          </Button>
          <Button variant="default" onClick={handleConfirm} id="confirm">
            <Translator path="common.actions.confirm" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  navigate?: (to: string) => void;
}

const NewChatButton = ({ navigate, ...buttonProps }: Props) => {
  const [open, setOpen] = useState(false);
  const { clear } = useChatInteract();
  const { chatProfile, setChatProfile } = useChatSession();
  const [selectedChatProfile, setSelectedChatProfile] = useState<
    string | undefined
  >(chatProfile);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    setChatProfile(selectedChatProfile);
    clear();
    navigate?.('/');
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
              className="text-muted-foreground hover:text-muted-foreground"
              onClick={handleClickOpen}
              {...buttonProps}
            >
              <EditSquare className="!size-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <Translator path="navigation.newChat.dialog.tooltip" />
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <NewChatDialog
        open={open}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
        selectedChatProfile={selectedChatProfile}
        setSelectedChatProfile={setSelectedChatProfile}
      />
    </div>
  );
};

export default NewChatButton;
