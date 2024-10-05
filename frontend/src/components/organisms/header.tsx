import { memo } from 'react';
import { useRecoilValue } from 'recoil';

import { Stack, Typography } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useAudio } from '@chainlit/react-client';

import UserButton from 'components/atoms/buttons/userButton';
import { Logo } from 'components/atoms/logo';
import ChatProfiles from 'components/molecules/chatProfiles';
import NewChatButton from 'components/molecules/newChatButton';

import { settingsState } from 'state/settings';

import AudioPresence from './chat/inputBox/AudioPresence';
import { OpenSideBarMobileButton } from './sidebar/OpenSideBarMobileButton';
import Translator from 'components/i18n/Translator';

const Header =(): JSX.Element => (
  <Stack
    px={2}
    py={1.5}
    direction="row"
    alignItems="center"
    justifyContent="space-between"
    bgcolor="background.paper"
  >
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Logo style={{ maxHeight: '25px' }} />
    </Stack>
    <Stack direction="row" alignItems="center" spacing={1}>
      <ChatProfiles />
      <NewChatButton />
    </Stack>
  </Stack>
);


export { Header };
