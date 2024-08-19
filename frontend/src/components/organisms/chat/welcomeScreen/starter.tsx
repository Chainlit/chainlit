import { useCallback, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { Box, Button, Stack, Typography } from '@mui/material';

import {
  ChainlitContext,
  IStarter,
  IStep,
  useAuth,
  useChatData
} from '@chainlit/react-client';
import { useChatInteract } from '@chainlit/react-client';

interface Props {
  starter: IStarter;
}

export default function Starter({ starter }: Props) {
  const apiClient = useContext(ChainlitContext);
  const { sendMessage } = useChatInteract();
  const { loading } = useChatData();
  const { user } = useAuth();

  const onSubmit = useCallback(async () => {
    const message: IStep = {
      threadId: '',
      id: uuidv4(),
      name: user?.identifier || 'User',
      type: 'user_message',
      output: starter.message,
      createdAt: new Date().toISOString()
    };

    sendMessage(message, []);
  }, [user, sendMessage, starter]);

  return (
    <Button
      id={`starter-${starter.label.trim().toLowerCase().replaceAll(' ', '-')}`}
      fullWidth
      disabled={loading}
      color="inherit"
      sx={{
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: '1rem',
        height: 100,
        p: 2,
        textTransform: 'none',
        justifyContent: 'flex-start'
      }}
      onClick={onSubmit}
    >
      <Stack gap={0.5} flexGrow={1} height="100%">
        {starter.icon ? (
          <img
            style={{ borderRadius: '50%' }}
            src={
              starter.icon?.startsWith('/public')
                ? apiClient.buildEndpoint(starter.icon)
                : starter.icon
            }
            alt={starter.label}
            height={20}
            width={20}
          />
        ) : (
          <Box sx={{ height: 20, width: 20 }} />
        )}
        <Typography
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            fontSize: '14px'
          }}
          color="text.secondary"
          align="left"
        >
          {starter.label}
        </Typography>
      </Stack>
    </Button>
  );
}
