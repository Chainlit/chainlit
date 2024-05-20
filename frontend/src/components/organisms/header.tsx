import { memo } from 'react';
import { useRecoilValue } from 'recoil';

import { Box, Stack } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';

import GithubButton from 'components/atoms/buttons/githubButton';
import ChatProfiles from 'components/molecules/chatProfiles';
import NewChatButton from 'components/molecules/newChatButton';

import { settingsState } from 'state/settings';

import { OpenSideBarMobileButton } from './sidebar/OpenSideBarMobileButton';

const Header = memo(() => {
  const isMobile = useMediaQuery('(max-width: 66rem)');
  const { isChatHistoryOpen } = useRecoilValue(settingsState);

  return (
    <Box
      px={1}
      py={1}
      display="flex"
      height="45px"
      alignItems="center"
      flexDirection="row"
      justifyContent={isMobile ? 'space-between' : 'initial'}
      color="text.primary"
      gap={2}
      id="header"
    >
      {isMobile ? <OpenSideBarMobileButton /> : null}
      {!isMobile && !isChatHistoryOpen ? <NewChatButton /> : null}
      <ChatProfiles />
      {isMobile ? (
        <Stack direction="row" alignItems="center">
          <NewChatButton />
          <GithubButton />
        </Stack>
      ) : null}
      {!isMobile ? <GithubButton sx={{ ml: 'auto' }} /> : null}
    </Box>
  );
});

export { Header };
