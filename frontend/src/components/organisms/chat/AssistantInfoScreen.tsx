import { useContext, useEffect, useMemo, useState } from 'react';

import { Avatar, Box, Stack, Typography } from '@mui/material';
import Fade from '@mui/material/Fade';

import { IStep } from '@chainlit/react-client';
import { ChainlitContext, useChatMessages } from '@chainlit/react-client';

import { Markdown } from 'components/molecules/Markdown';

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
    const createdBy = selectedAssistant?.settings_values['created_by'];
    let icon = selectedAssistant?.settings_values['icon'] || null;

    if (icon?.startsWith('/avatars')) {
      icon = apiClient.buildEndpoint(icon);
    }

    return (
      <Stack gap={2} alignItems="center">
        <Avatar sx={{ height: 96, width: 96 }} src={icon} />
        {name ? (
          <Typography
            color="text.primary"
            sx={{ fontSize: '1.3rem', fontWeight: 600 }}
          >
            {name}
          </Typography>
        ) : null}
        {createdBy ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography color="text.secondary" sx={{ fontSize: '0.9rem' }}>
              by {createdBy}
            </Typography>
            <Avatar sx={{ width: 24, height: 24 }} />
          </Stack>
        ) : null}
      </Stack>
    );
  }, [selectedAssistant, apiClient]);

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
        color="text.primary"
      >
        {hideLogo ? null : <Stack>{logo}</Stack>}
        {selectedAssistant.settings_values['markdown_description'] && (
          <Box
            sx={{
              backgroundColor: 'background.paper',
              borderRadius: '8px',
              paddingLeft: '16px',
              paddingRight: '16px'
              // width: '100%'
            }}
          >
            <Markdown allowHtml={false} latex={false}>
              {selectedAssistant.settings_values['markdown_description']}
            </Markdown>
          </Box>
        )}
      </Stack>
    </Fade>
  );
}
