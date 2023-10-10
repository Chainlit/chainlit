import { wsEndpoint } from 'api';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { router } from 'router';

import { Box, GlobalStyles } from '@mui/material';
import { Theme, ThemeProvider } from '@mui/material/styles';

import { useChat } from '@chainlit/components';
import { makeTheme } from '@chainlit/components/theme';

import Hotkeys from 'components/Hotkeys';
import SettingsModal from 'components/molecules/settingsModal';
import ChatSettingsModal from 'components/organisms/chat/settings';
import PromptPlayground from 'components/organisms/playground';

import { useAuth } from 'hooks/auth';

import { chatProfile, projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';
import { userEnvState } from 'state/user';

import './App.css';

type Primary = {
  dark?: string;
  light?: string;
  main?: string;
};

type ThemOverride = {
  primary?: Primary;
  background?: string;
  paper?: string;
};

declare global {
  interface Window {
    theme?: {
      light?: ThemOverride;
      dark?: ThemOverride;
    };
  }
}

function overrideTheme(theme: Theme) {
  const variant = theme.palette.mode;
  const variantOverride = window?.theme?.[variant] as ThemOverride;
  if (variantOverride?.background) {
    theme.palette.background.default = variantOverride.background;
  }
  if (variantOverride?.paper) {
    theme.palette.background.paper = variantOverride.paper;
  }
  if (variantOverride?.primary?.main) {
    theme.palette.primary.main = variantOverride.primary.main;
  }
  if (variantOverride?.primary?.dark) {
    theme.palette.primary.dark = variantOverride.primary.dark;
  }
  if (variantOverride?.primary?.light) {
    theme.palette.primary.light = variantOverride.primary.light;
  }

  return theme;
}

function App() {
  const { theme: themeVariant } = useRecoilValue(settingsState);
  const pSettings = useRecoilValue(projectSettingsState);
  const chatProfileValue = useRecoilValue(chatProfile);
  const theme = overrideTheme(makeTheme(themeVariant));
  const { isAuthenticated, accessToken } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const { connect } = useChat();

  useEffect(() => {
    if (
      isAuthenticated &&
      pSettings?.chatProfiles &&
      (pSettings.chatProfiles.length <= 1 || chatProfileValue)
    ) {
      // Autoselect the chat profile if there is only one
      const chatProfile =
        pSettings.chatProfiles.length === 1
          ? pSettings.chatProfiles[0].name
          : chatProfileValue;
      connect({
        wsEndpoint,
        userEnv,
        accessToken,
        chatProfile
      });
    }
  }, [
    userEnv,
    accessToken,
    isAuthenticated,
    connect,
    pSettings?.chatProfiles,
    chatProfileValue
  ]);

  return (
    <ThemeProvider theme={theme}>
      <GlobalStyles
        styles={{
          body: { backgroundColor: theme.palette.background.default }
        }}
      />
      <Toaster
        toastOptions={{
          className: 'toast',
          style: {
            maxWidth: 500,
            fontFamily: 'Inter',
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            padding: theme.spacing(1),
            color: theme.palette.text.primary,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0px 2px 4px 0px #0000000D'
                : '0px 10px 10px 0px #0000000D'
          }
        }}
      />
      <Box
        display="flex"
        height="100vh"
        width="100vw"
        sx={{ overflowX: 'hidden' }}
      >
        <PromptPlayground />
        <ChatSettingsModal />
        <Hotkeys />
        <SettingsModal />
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
