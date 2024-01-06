import StopCircle from '@mui/icons-material/StopCircle';
import Telegram from '@mui/icons-material/Telegram';
import { Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useChatData, useChatInteract } from '@chainlit/react-client';

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
        <Tooltip title="Send message">
          <InputAdornment position="end">
            <IconButton disabled={disabled} color="inherit" onClick={onSubmit}>
              <Telegram />
            </IconButton>
          </InputAdornment>
        </Tooltip>
      ) : (
        <Tooltip title="Stop task">
          <IconButton id="stop-button" onClick={handleClick}>
            <StopCircle />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
};

export { SubmitButton };
