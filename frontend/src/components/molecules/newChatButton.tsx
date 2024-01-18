import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box } from '@mui/material';

import { useChatInteract } from '@chainlit/react-client';
import { AccentButton } from '@chainlit/react-components';

import { Translator } from 'components/i18n';

import SquarePenIcon from 'assets/squarePen';

import NewChatDialog from './newChatDialog';

export default function NewChatButton() {
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
    <Box>
      <AccentButton
        id="new-chat-button"
        variant="outlined"
        onClick={handleClickOpen}
        startIcon={<SquarePenIcon />}
      >
        <Translator path="components.molecules.newChatButton.newChat" />
      </AccentButton>
      <NewChatDialog
        open={open}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </Box>
  );
}
