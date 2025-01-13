import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { ChainlitContext, useAuth } from '@chainlit/react-client';

import { ThemeProvider } from './ThemeProvider';

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
  const { isAuthenticated, data } = useAuth();
  const apiClient = useContext(ChainlitContext);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const [authError, setAuthError] = useState<string>();
  const [fetchError, setFetchError] = useState<string>();

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

  const defaultTheme = widgetConfig.theme || data?.default_theme;

  useEffect(() => {
    if (fetchError) return;
    if (!isAuthenticated) {
      if (!widgetConfig.accessToken) {
        setAuthError('No authentication token provided.');
      } else {
        apiClient
          .jwtAuth(widgetConfig.accessToken)
          .catch((err) => setAuthError(String(err)));
      }
    } else {
      setAuthError(undefined);
    }
  }, [isAuthenticated, apiClient, fetchError, setAuthError]);

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
      <Toaster className="toast" position="bottom-center" />
      <Widget config={widgetConfig} error={fetchError || authError} />
    </ThemeProvider>
  );
}
