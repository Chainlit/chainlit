import CloseIcon from '@mui/icons-material/Close';
import { WidgetContext } from 'context';
import { useContext } from 'react';

import { Box, IconButton } from '@mui/material';

export default function CloseModalButton() {
  const { evoya } = useContext(WidgetContext);

  const handleClick = () => {
    if (evoya?.type === 'default') {
      // const toggleButton = document.getElementById("chainlit-copilot-button");

      // console.log(toggleButton);
      // if (toggleButton) {
      //   toggleButton.click();
      // }
      window.dispatchEvent(new CustomEvent('copilot-close-popover'));
    } else {
      window.dispatchEvent(new CustomEvent('copilot-close-modal'));
    }
  };

  return (
    <Box>
      <IconButton edge="end" id="new-chat-button" onClick={handleClick} sx={evoya?.type === 'dashboard' ? {} : {color: 'primary.contrastText'}}>
        <CloseIcon sx={{ width: 20, height: 20 }} />
      </IconButton>
    </Box>
  );
}
