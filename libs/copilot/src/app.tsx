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
  const { isAuthenticated, data, user, setUser } = useAuth();
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
  }, [evoya]);


  useEffect(() => {
    if (config && config?.ui && config?.ui?.cot !== 'hidden') {
      setConfig({
        ...config,
        showEvoyaCreatorButton: evoya?.evoyaCreator?.enabled,
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
    loadTranslations();
  }, []);

  const loadTranslations = async () => {
    try {
      const translations = await import(
        `../../../translations/${languageInUse}.json`
      );
      i18n.addResourceBundle(languageInUse, 'translation', translations);
      i18n.changeLanguage(languageInUse);
    } catch (error) {
      console.error(
        `Could not load translations for ${languageInUse}:`,
        error
      );
    }
  };


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
    setUser(userData)
    setTimeout(clear(), 1500)
  }

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
      <Toaster richColors className="toast" position="top-right" />
      {evoya.type === 'default' ? <Widget config={widgetConfig} error={fetchError || authError} /> : <WidgetEmbedded />}
    </ThemeProvider>
  );
}
