import { WidgetContext } from 'context';
import { useContext, useEffect } from 'react';
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
  const apiClient = useContext(ChainlitContext);
  const { accessToken } = useContext(WidgetContext);
  const { config } = useConfig(accessToken);
  const { setAccessToken } = useAuth();
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';

  useEffect(() => {
    setAccessToken(widgetConfig.accessToken || "");
  }, [widgetConfig.accessToken]);

  useEffect(() => {
    if (!config) return;

    apiClient
      .get(`/project/translations?language=${languageInUse}`, accessToken)
      .then((res) => res.json())
      .then((data) => {
        i18n.addResourceBundle(languageInUse, 'translation', data.translation);
        i18n.changeLanguage(languageInUse);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [config]);


  if (!config) {
    return null;
  }

  const defaultTheme = widgetConfig.theme || config.ui.default_theme;

  return (
    <ThemeProvider storageKey="vite-ui-theme" defaultTheme={defaultTheme}>
    <Toaster
    className="toast"
    position="bottom-center"
  />
      <Widget config={widgetConfig} />
      </ThemeProvider>
  );
}
