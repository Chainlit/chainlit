import { Box, Stack, Typography } from '@mui/material';
import { useRecoilValue } from 'recoil';
import { tokenCountState } from 'state/chat';
import Input from './input';
import StopButton from '../stopButton';

interface Props {
  onSubmit: (message: string) => void;
  onReply: (message: string) => void;
}

export default function InputBox({ onSubmit, onReply }: Props) {
  const tokenCount = useRecoilValue(tokenCountState);

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={2}
      py={2}
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '60rem',
        m: 'auto',
        justifyContent: 'center'
      }}
    >
      <StopButton />
      <Box>
        <Input onSubmit={onSubmit} onReply={onReply} />
        {tokenCount > 0 && (
          <Stack flexDirection="row" alignItems="center">
            <Typography
              sx={{ ml: 'auto' }}
              color="text.secondary"
              variant="caption"
            >
              Token usage: {tokenCount}
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );
}
