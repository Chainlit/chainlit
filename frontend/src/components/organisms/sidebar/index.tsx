import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { Alert } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useAuth, useConfig } from '@chainlit/react-client';

import GithubButton from 'components/atoms/buttons/githubButton';
import { Logo } from 'components/atoms/logo';
import ReadmeButton from 'components/organisms/readmeButton';

import { settingsState } from 'state/settings';

import TriggerButton from './OpenSideBarButton';
import { ThreadHistory } from './threadHistory';

const DRAWER_WIDTH = 260;

const SideBar = () => {
  const user = useAuth();
  const isMobile = useMediaQuery('(max-width:66rem)');

  const [settings, setSettings] = useRecoilState(settingsState);
  const { config } = useConfig();
  const enableHistory = !!user.accessToken && !!config?.dataPersistence;

  useEffect(() => {
    if (isMobile) {
      setChatHistoryOpen(false);
    } else {
      setChatHistoryOpen(enableHistory);
    }
  }, [enableHistory]);

  const setChatHistoryOpen = (open: boolean) =>
    setSettings((prev) => ({ ...prev, isChatHistoryOpen: open }));

  return (
    <Box display="flex" position="relative">
      <Drawer
        className="chat-history-drawer"
        anchor="left"
        open={settings.isChatHistoryOpen}
        variant={isMobile ? 'temporary' : 'persistent'}
        transitionDuration={0}
        hideBackdrop={!isMobile}
        onClose={() => setChatHistoryOpen(false)}
        sx={{
          width: settings.isChatHistoryOpen ? 'auto' : 0,
          '& .MuiDrawer-paper': {
            width: settings.isChatHistoryOpen ? DRAWER_WIDTH : 0,
            position: 'inherit',
            gap: 1,
            display: 'flex',
            flexDirection: 'column',
            padding: '0px 4px',
            backgroundImage: 'none',
            borderRight: 'none',
            px: 2,
            boxSizing: 'border-box',
            boxShadow: (theme) =>
              theme.palette.mode === 'dark'
                ? '0px 4px 20px 0px rgba(0, 0, 0, 0.20)'
                : '0px 4px 20px 0px rgba(0, 0, 0, 0.05)'
          }
        }}
      >
        <Stack
          sx={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '45px',
            mt: 1
          }}
        >
          <Logo style={{ maxHeight: '25px' }} />
        </Stack>
        {enableHistory ? (
          <ThreadHistory />
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Alert severity="info">Conversations are not persisted.</Alert>
          </Box>
        )}
        <Stack mb={2}>
          <ReadmeButton />
          <GithubButton />
        </Stack>
      </Drawer>
      {!isMobile ? (
        <Box
          position="absolute"
          sx={{
            top: '50%',
            transform: 'translateY(-100%)',
            right: -30,
            zIndex: 10
          }}
        >
          <TriggerButton
            onClick={() => setChatHistoryOpen(!settings.isChatHistoryOpen)}
            open={settings.isChatHistoryOpen}
          />
        </Box>
      ) : null}
    </Box>
  );
};

export { SideBar };
