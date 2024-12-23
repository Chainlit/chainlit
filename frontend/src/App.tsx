import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { router } from 'router';
import { Toaster } from "@/components/ui/sonner"
import { makeTheme } from 'theme';

import { Theme, ThemeProvider as TP } from '@mui/material/styles';

import { useAuth, useChatSession, useConfig } from '@chainlit/react-client';

import { settingsState } from 'state/settings';
import { userEnvState } from 'state/user';

import './App.css';
import { ThemeProvider } from './components/ThemeProvider';
import ChatSettingsModal from './components/ChatSettings';

type Primary = {
  dark?: string;
  light?: string;
  main?: string;
};

type Text = {
  primary?: string;
  secondary?: string;
};

type ThemOverride = {
  primary?: Primary;
  background?: string;
  paper?: string;
  text?: Text;
};

declare global {
  interface Window {
    theme?: {
      default: string;
      light?: ThemOverride;
      dark?: ThemOverride;
    };
    transports?: string[]
  }
}

export function overrideTheme(theme: Theme) {
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
  if (variantOverride?.text?.primary) {
    theme.palette.text.primary = variantOverride.text.primary;
  }
  if (variantOverride?.text?.secondary) {
    theme.palette.text.secondary = variantOverride.text.secondary;
  }

  return theme;
}

function App() {
  const { theme: themeVariant } = useRecoilValue(settingsState);
  const { config } = useConfig();

  // @ts-expect-error custom property
  const fontFamily = window.theme?.font_family;
  const theme = overrideTheme(makeTheme(themeVariant, fontFamily));
  const { isAuthenticated, accessToken } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const { connect, chatProfile, setChatProfile } = useChatSession();

  const configLoaded = !!config;

  const chatProfileOk = configLoaded
    ? config.chatProfiles.length
      ? !!chatProfile
      : true
    : false;

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    } else if (!chatProfileOk) {
      return;
    } else {
      connect({
        transports: window.transports,
        userEnv,
        accessToken
      });
    }
  }, [userEnv, accessToken, isAuthenticated, connect, chatProfileOk]);

  if (configLoaded && config.chatProfiles.length && !chatProfile) {
    // Autoselect the first default chat profile
    const defaultChatProfile = config.chatProfiles.find(
      (profile) => profile.default
    );
    if (defaultChatProfile) {
      setChatProfile(defaultChatProfile.name);
    } else {
      setChatProfile(config.chatProfiles[0].name);
    }
  }

  return (
    <ThemeProvider storageKey="vite-ui-theme">

    <TP theme={theme}>

      <Toaster
        className="toast"
        position="top-right"
      />

        <ChatSettingsModal />
        <RouterProvider router={router} />
   
    </TP>
    </ThemeProvider>
  );
}

export default App;
