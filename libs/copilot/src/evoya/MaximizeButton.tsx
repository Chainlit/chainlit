import OpenInFull from '@mui/icons-material/OpenInFull';

import { Box, IconButton, Tooltip } from '@mui/material';
import { Translator } from '@chainlit/app/src/components/i18n';

export default function MaximizeButton() {

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('chainlit-open-modal'))
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.maximizeChatButton.maximizeChat" />}
      >
        <IconButton edge="end" id="maximize-chat-button" onClick={handleClick}>
          <OpenInFull sx={{ width: 20, height: 20 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
