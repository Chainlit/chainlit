import { useEffect, useMemo, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { Avatar, Grid, Stack, Typography } from '@mui/material';
import Fade from '@mui/material/Fade';

import { useChatMessages, useChatSession } from '@chainlit/react-client';

import { apiClientState } from 'state/apiClient';
import { projectSettingsState } from 'state/project';

import Starter from './starter';

interface Props {
  hideLogo?: boolean;
}

export default function WelcomeScreen({ hideLogo }: Props) {
  const { messages } = useChatMessages();
  const [show, setShow] = useState(true);
  const { chatProfile } = useChatSession();
  const pSettings = useRecoilValue(projectSettingsState);
  const apiClient = useRecoilValue(apiClientState);
  const defaultIconUrl = apiClient?.buildEndpoint(`/avatars/default`);

  useEffect(() => {
    if (messages.length > 0) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [messages]);

  const selectedChatProfile = useMemo(() => {
    return pSettings?.chatProfiles.find(
      (profile) => profile.name === chatProfile
    );
  }, [pSettings, chatProfile]);

  const logo = useMemo(() => {
    const name = selectedChatProfile?.name;
    let icon = selectedChatProfile?.icon || defaultIconUrl;

    if (icon?.startsWith('/public')) {
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
  }, [pSettings, chatProfile, selectedChatProfile]);

  const starters = useMemo(() => {
    if (chatProfile) {
      const selectedChatProfile = pSettings?.chatProfiles.find(
        (profile) => profile.name === chatProfile
      );
      if (selectedChatProfile?.starters) {
        return selectedChatProfile.starters.slice(0, 4);
      }
    }
    return pSettings?.starters;
  }, [pSettings, chatProfile]);

  if (!starters?.length) {
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
        <Grid container spacing={2} minHeight={100} justifyContent="center">
          {starters?.map((starter, i) => (
            <Fade in={show} timeout={i * 300} key={i}>
              <Grid item xs={6} sm={3}>
                <Starter starter={starter} />
              </Grid>
            </Fade>
          ))}
        </Grid>
      </Stack>
    </Fade>
  );
}
