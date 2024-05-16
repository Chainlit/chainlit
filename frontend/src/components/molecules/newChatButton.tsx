import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Box, IconButton, IconButtonProps, Tooltip } from '@mui/material';

import { useChatInteract } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import SquarePenIcon from 'assets/squarePen';

import NewChatDialog from './newChatDialog';

export default function NewChatButton(props: IconButtonProps) {
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
      <Tooltip
        title={<Translator path="components.molecules.newChatButton.newChat" />}
      >
        <IconButton id="new-chat-button" onClick={handleClickOpen} {...props}>
          <SquarePenIcon sx={{ height: 20, width: 20 }} />
        </IconButton>
      </Tooltip>
      <NewChatDialog
        open={open}
        handleClose={handleClose}
        handleConfirm={handleConfirm}
      />
    </Box>
  );
}
