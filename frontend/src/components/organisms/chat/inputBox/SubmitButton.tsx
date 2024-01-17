import StopCircle from '@mui/icons-material/StopCircle';
import Telegram from '@mui/icons-material/Telegram';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import { useChatData, useChatInteract } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

interface SubmitButtonProps {
  disabled?: boolean;
  onSubmit: () => void;
}

const SubmitButton = ({ disabled, onSubmit }: SubmitButtonProps) => {
  const { loading } = useChatData();
  const { stopTask } = useChatInteract();

  const handleClick = () => {
    stopTask();
  };

  return (
    <Box
      sx={{
        mr: 1,
        color: 'text.secondary'
      }}
    >
      {!loading ? (
        <Tooltip
          title={
            <Translator path="components.organisms.chat.inputBox.SubmitButton.sendMessage" />
          }
        >
          <IconButton disabled={disabled} color="inherit" onClick={onSubmit}>
            <Telegram />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip
          title={
            <Translator path="components.organisms.chat.inputBox.SubmitButton.stopTask" />
          }
        >
          <IconButton id="stop-button" onClick={handleClick}>
            <StopCircle />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export { SubmitButton };
