import StopCircle from '@mui/icons-material/StopCircle';
import Telegram from '@mui/icons-material/Telegram';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import {
  useChatData,
  useChatInteract,
  useChatMessages
} from '@chainlit/react-client';

import { Translator } from 'components/i18n';

interface SubmitButtonProps {
  disabled?: boolean;
  onSubmit: () => void;
}

const SubmitButton = ({ disabled, onSubmit }: SubmitButtonProps) => {
  const { loading } = useChatData();
  const { firstInteraction } = useChatMessages();
  const { stopTask } = useChatInteract();

  const handleClick = () => {
    stopTask();
  };

  return (
    <Box
      sx={{
        mr: 0,
        color: 'text.secondary'
      }}
    >
      {loading && firstInteraction ? (
        <Tooltip
          title={
            <Translator path="components.organisms.chat.inputBox.SubmitButton.stopTask" />
          }
        >
          <IconButton 
            id="stop-button" 
            onClick={handleClick}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <StopCircle />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip
          title={
            <Translator path="components.organisms.chat.inputBox.SubmitButton.sendMessage" />
          }
        >
          <IconButton 
            disabled={disabled} 
            onClick={onSubmit}
            sx={{
              backgroundColor: disabled ? '#E0E0E0' : '#FF7E13',
              color: disabled ? '#9E9E9E' : '#fff',
              '&:hover': {
                backgroundColor: disabled ? '#E0E0E0' : '#F4511E'
              },
              '&.Mui-disabled': {
                backgroundColor: '#E0E0E0',
                color: '#fff'
              },
              transition: 'all 0.2s ease',
              width: 32,
              height: 32
            }}
          >
            <Telegram sx={{ fontSize: 20 }} />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export { SubmitButton };
