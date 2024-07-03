import CloseIcon from '@mui/icons-material/Close';
import { WidgetContext } from 'context';
import { useContext } from 'react';

import { Box, IconButton } from '@mui/material';

export default function CloseModalButton() {
  const { evoya, config } = useContext(WidgetContext);

  const handleClick = () => {
    if (evoya?.type === 'default') {
      const toggleButton = document.getElementById("chainlit-copilot-button");

      if (toggleButton) {
        toggleButton.click();
      }
    } else {
      window.dispatchEvent(new CustomEvent('copilot-close-modal'));
    }
  };

  return (
    <Box>
      <IconButton edge="end" id="new-chat-button" onClick={handleClick} sx={evoya?.type === 'dashboard' ? {} : {color: config?.button?.style?.color}}>
        <CloseIcon sx={{ width: 20, height: 20 }} />
      </IconButton>
    </Box>
  );
}
