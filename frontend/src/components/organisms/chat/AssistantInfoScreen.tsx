import { useContext, useEffect, useMemo, useState } from 'react';

import { Avatar, Stack, Typography } from '@mui/material';
import Fade from '@mui/material/Fade';

import { IStep } from '@chainlit/react-client';
import { ChainlitContext, useChatMessages } from '@chainlit/react-client';

interface Props {
  hideLogo?: boolean;
  selectedAssistant?: any;
}

const hasMessage = (messages: IStep[]): boolean => {
  const validTypes = ['user_message', 'assistant_message'];
  return messages.some(
    (message) =>
      validTypes.includes(message.type) || hasMessage(message.steps || [])
  );
};

export default function AssistantInfoScreen({
  hideLogo,
  selectedAssistant
}: Props) {
  const { messages } = useChatMessages();
  const [show, setShow] = useState(true);
  const apiClient = useContext(ChainlitContext);

  useEffect(() => {
    setShow(!hasMessage(messages));
  }, [messages]);

  const logo = useMemo(() => {
    const name = selectedAssistant?.settings_values['name'];
    let icon = selectedAssistant?.settings_values['icon'] || null;

    if (icon?.startsWith('/avatars')) {
      icon = apiClient.buildEndpoint(icon);
    }

    return (
      <Stack gap={2} alignItems="center">
        <Avatar sx={{ height: 48, width: 48 }} src={icon} />
        {name ? (
          <Typography
            color="text.primary"
            sx={{ fontSize: '1.1rem', fontWeight: 600 }}
          >
            {name}
          </Typography>
        ) : null}
      </Stack>
    );
  }, [selectedAssistant]);

  if (!selectedAssistant) {
    return null;
  }

  return (
    <Fade in={show}>
      <Stack
        position="absolute"
        zIndex={show ? 1 : -1}
        width="100%"
        height="100%"
        mx="auto"
        left={0}
        right={0}
        sx={{ overflowY: 'auto' }}
        maxWidth="min(48rem, 80vw)"
        justifyContent={hideLogo ? 'end' : 'center'}
        alignItems="center"
        gap={6}
        px={2}
        boxSizing={'border-box'}
      >
        {hideLogo ? null : <Stack>{logo}</Stack>}
      </Stack>
    </Fade>
  );
}
