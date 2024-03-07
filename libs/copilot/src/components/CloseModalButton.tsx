import CloseIcon from '@mui/icons-material/Close';

import { Box, IconButton } from '@mui/material';

export default function CloseModalButton() {

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('chainlit-close-modal'))
  };

  return (
    <Box>
      <IconButton edge="end" id="new-chat-button" onClick={handleClick}>
        <CloseIcon sx={{ width: 20, height: 20 }} />
      </IconButton>
    </Box>
  );
}
