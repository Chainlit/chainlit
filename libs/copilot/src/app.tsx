import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';
import { useRecoilState } from 'recoil';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { ChainlitContext, useAuth, useChatInteract, configState } from '@chainlit/react-client';

import { ThemeProvider } from './ThemeProvider';
import WidgetEmbedded from './widgetEmbed';
import { WidgetContext } from './context';

interface Props {
  widgetConfig: IWidgetConfig;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
    toggleChainlitCopilot: () => void;
    theme?: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  }
}

export default function App({ widgetConfig }: Props) {
  const { isAuthenticated, data, user,setUser } = useAuth();
  const [config, setConfig] = useRecoilState(configState);
  const { evoya } = useContext(WidgetContext)
  const apiClient = useContext(ChainlitContext);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const [authError, setAuthError] = useState<string>();
  const [fetchError, setFetchError] = useState<string>();
  const { clear } = useChatInteract();

  useEffect(() => {
    if (evoya.reset) {
      clear();
    }
  }, [config, isAuthenticated, evoya, user]);


  useEffect(() => {
    if (config && config?.ui && config?.ui?.cot !== 'hidden') {
      setConfig({
        ...config,
        ...{
          ui: {
            ...config?.ui,
            cot: 'hidden'
          }
        }
      });
    }
  }, [config]);

  useEffect(() => {
    apiClient
      .get(`/project/translations?language=${languageInUse}`)
      .then((res) => res.json())
      .then((data) => {
        i18n.addResourceBundle(languageInUse, 'translation', data.translation);
        i18n.changeLanguage(languageInUse);
      })
      .catch((err) => {
        setFetchError(String(err));
      });
  }, []);

  const defaultTheme = widgetConfig.theme || 'light';

  useEffect(() => {
    if (fetchError) return;
    if (!isAuthenticated) {
      if (!widgetConfig.accessToken) {
        setAuthError('No authentication token provided.');
      } else {
        apiClient
          .jwtAuth(widgetConfig.accessToken)
          .then((res) => getUserWithAuth())
          .catch((err) => setAuthError(String(err)));
      }
    } else {
      setAuthError(undefined);
    }
  }, [isAuthenticated, apiClient, fetchError, setAuthError]);

  const getUserWithAuth = async () => {
    const userData = await apiClient
      .getUser(widgetConfig.accessToken)
      .catch((err) => setAuthError(String(err)));
    clear()
    setUser(userData)
  }

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
      <Toaster richColors className="toast" position="top-right" />
      {evoya.type === 'default' ? <Widget config={widgetConfig} error={fetchError || authError} /> : <WidgetEmbedded />}
    </ThemeProvider>
  );
}
