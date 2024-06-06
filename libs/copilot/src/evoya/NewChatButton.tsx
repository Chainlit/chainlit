import { Box, Tooltip, Button } from '@mui/material';
import Add from '@mui/icons-material/Add';

import { Translator } from '@chainlit/app/src/components/i18n';

export default function NewChatButton() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('copilot-new-session'));
  };

  return (
    <Box>
      <Tooltip
        title={<Translator path="components.molecules.newChatButton.newChat" />}
      >
        <Button variant="outlined" startIcon={<Add />} onClick={handleClick}>
          <Translator path="components.molecules.newChatButton.newChatSession" />
        </Button>
      </Tooltip>
    </Box>
  );
}
