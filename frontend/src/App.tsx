import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { router } from 'router';

import { useAuth, useChatSession, useConfig } from '@chainlit/react-client';

import ChatSettingsModal from './components/ChatSettings';
import { ThemeProvider } from './components/ThemeProvider';
import { Loader } from '@/components/Loader';
import { Toaster } from '@/components/ui/sonner';

import { userEnvState } from 'state/user';

declare global {
  interface Window {
    cl_shadowRootElement?: HTMLDivElement;
    transports?: string[];
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  }
}

function App() {
  const { config } = useConfig();

  const { isAuthenticated, data, isReady } = useAuth();
  const userEnv = useRecoilValue(userEnvState);
  const { connect, chatProfile, setChatProfile } = useChatSession();

  const configLoaded = !!config;

  const chatProfileOk = configLoaded
    ? config.chatProfiles.length
      ? !!chatProfile
      : true
    : false;

  useEffect(() => {
    if (!isAuthenticated || !isReady || !chatProfileOk) {
      return;
    }

    connect({
      transports: window.transports,
      userEnv
    });
  }, [userEnv, isAuthenticated, connect, isReady, chatProfileOk]);

  useEffect(() => {
    if (
      !configLoaded ||
      !config ||
      !config.chatProfiles?.length ||
      chatProfile
    ) {
      return;
    }

    const defaultChatProfile = config.chatProfiles.find(
      (profile) => profile.default
    );

    if (defaultChatProfile) {
      setChatProfile(defaultChatProfile.name);
    } else {
      setChatProfile(config.chatProfiles[0].name);
    }
  }, [configLoaded, config, chatProfile, setChatProfile]);

  if (!configLoaded && isAuthenticated) return null;

  return (
    <ThemeProvider
      storageKey="vite-ui-theme"
      defaultTheme={data?.default_theme}
    >
      <Toaster richColors className="toast" position="top-right" />

      <ChatSettingsModal />
      <RouterProvider router={router} />

      <div
        className={cn(
          'bg-[hsl(var(--background))] flex items-center justify-center fixed size-full p-2 top-0',
          isReady && 'hidden'
        )}
      >
        <Loader className="!size-6" />
      </div>
    </ThemeProvider>
  );
}

export default App;
