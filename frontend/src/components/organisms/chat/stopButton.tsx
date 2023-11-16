import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';

import { useChatData, useChatInteract } from '@chainlit/react-client';
import { GreyButton } from '@chainlit/react-components';

export default function StopButton() {
  const { loading } = useChatData();
  const { stopTask } = useChatInteract();

  if (!loading) {
    return null;
  }

  const handleClick = () => {
    stopTask();
  };

  return (
    <Box margin="auto">
      <GreyButton
        id="stop-button"
        startIcon={<CloseIcon />}
        variant="contained"
        onClick={handleClick}
      >
        Stop task
      </GreyButton>
    </Box>
  );
}
