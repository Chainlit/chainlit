import OpenInFull from '@mui/icons-material/OpenInFull';

import { WidgetContext } from 'context';
import { useContext } from 'react';

import { Box, IconButton, Tooltip } from '@mui/material';
import { Translator } from '@chainlit/app/src/components/i18n';

export default function MaximizeButton() {
  const { evoya, config } = useContext(WidgetContext);

  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-open-modal'))
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.maximizeChatButton.maximizeChat" />}
      >
        <IconButton edge="end" id="maximize-chat-button" onClick={handleClick} sx={evoya?.type === 'dashboard' ? {} : {color: config?.button?.style?.color}}>
          <OpenInFull sx={{ width: 20, height: 20 }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
