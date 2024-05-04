import { useAuth } from 'api/auth';
import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { Alert } from '@mui/material';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import useMediaQuery from '@mui/material/useMediaQuery';

import UserButton from 'components/atoms/buttons/userButton';
import { Logo } from 'components/atoms/logo';
import NewChatButton from 'components/molecules/newChatButton';
import ReadmeButton from 'components/organisms/readmeButton';

import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

import TriggerButton from './OpenSideBarButton';
import { ThreadHistory } from './threadHistory';

const DRAWER_WIDTH = 260;

const SideBar = () => {
  const user = useAuth();
  const isMobile = useMediaQuery('(max-width:66rem)');

  const [settings, setSettings] = useRecoilState(settingsState);
  const pSettings = useRecoilValue(projectSettingsState);
  const enableHistory = !!user.accessToken && !!pSettings?.dataPersistence;

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
            mt: 1.5
          }}
        >
          <Logo style={{ maxHeight: '25px' }} />
          <NewChatButton edge="end" />
        </Stack>
        {enableHistory ? (
          <ThreadHistory />
        ) : (
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <Alert severity="info">Conversations are not persisted.</Alert>
          </Box>
        )}
        <ReadmeButton />
        <Box mb={2}>
          <UserButton />
        </Box>
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
