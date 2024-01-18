import { useState } from 'react';

import AddIcon from '@mui/icons-material/Add';
import { Box } from '@mui/material';

import { Translator } from '@chainlit/app/src/components/i18n';
import NewChatDialog from '@chainlit/app/src/components/molecules/newChatDialog';
import { useChatInteract } from '@chainlit/react-client';
import { AccentButton } from '@chainlit/react-components';

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
      <AccentButton
        id="new-chat-button"
        variant="outlined"
        onClick={handleClickOpen}
        startIcon={<AddIcon />}
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
