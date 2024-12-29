import { useContext, useEffect, useState } from 'react';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';

import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import {ThemeProvider} from '@chainlit/app/src/components/ThemeProvider';
import { ChainlitContext, useAuth, useConfig } from '@chainlit/react-client';

interface Props {
  widgetConfig: IWidgetConfig;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
  }
}

export default function App({ widgetConfig }: Props) {
  const { isAuthenticated, data } = useAuth();
  const apiClient = useContext(ChainlitContext);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const [authError, setAuthError] = useState<string>()

  useEffect(() => {
    apiClient
      .get(`/project/translations?language=${languageInUse}`)
      .then((res) => res.json())
      .then((data) => {
        i18n.addResourceBundle(languageInUse, 'translation', data.translation);
        i18n.changeLanguage(languageInUse);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const defaultTheme = widgetConfig.theme || data?.default_theme;

  useEffect(() => {
    if(!isAuthenticated) {
      if(!widgetConfig.accessToken) {
        setAuthError("No authentication token provided.")
      } else {
        apiClient.jwtAuth(widgetConfig.accessToken)
        .catch((err) => setAuthError(String(err)))
      }
    } else {
      setAuthError(undefined)
    }
  }, [isAuthenticated, apiClient, setAuthError])

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
    <Toaster
    className="toast"
    position="bottom-center"
  />
      <Widget config={widgetConfig} authError={authError} />
      </ThemeProvider>
  );
}
