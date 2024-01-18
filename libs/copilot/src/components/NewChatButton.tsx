import { useState } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';

import SquarePenIcon from '@chainlit/app/src/assets/squarePen';
import { Translator } from '@chainlit/app/src/components/i18n';
import NewChatDialog from '@chainlit/app/src/components/molecules/newChatDialog';
import { useChatInteract } from '@chainlit/react-client';

export default function NewChatButton() {
  const [open, setOpen] = useState(false);
  const { clear } = useChatInteract();

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    clear();
    handleClose();
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.newChatButton.newChat" />}
      >
        <IconButton edge="end" id="new-chat-button" onClick={handleClickOpen}>
          <SquarePenIcon sx={{ width: 20, height: 20 }} />
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
