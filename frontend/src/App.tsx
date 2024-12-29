import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { router } from 'router';
import { Toaster } from "@/components/ui/sonner"

import { useAuth, useChatSession, useConfig } from '@chainlit/react-client';

import { userEnvState } from 'state/user';

import { ThemeProvider } from './components/ThemeProvider';
import ChatSettingsModal from './components/ChatSettings';

declare global {
  interface Window {
    transports?: string[]
  }
}

function App() {
  const { config } = useConfig();

  const { isAuthenticated, data } = useAuth();
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
      });
    }
  }, [userEnv, isAuthenticated, connect, chatProfileOk]);

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

  if(!configLoaded && isAuthenticated) return null

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={data?.default_theme}>

      <Toaster
        className="toast"
        position="top-right"
      />

        <ChatSettingsModal />
        <RouterProvider router={router} />
   
    </ThemeProvider>
  );
}

export default App;
