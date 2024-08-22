import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';

import { Theme, ThemeProvider } from '@mui/material/styles';

import { overrideTheme } from '@chainlit/app/src/App';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { settingsState } from '@chainlit/app/src/state/settings';
import { makeTheme } from '@chainlit/app/src/theme';
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
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useState<Theme | null>(null);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';

  useEffect(() => {
    setAccessToken(widgetConfig.accessToken);
  }, [widgetConfig.accessToken]);

  useEffect(() => {
    if (!config) return;
    const themeVariant = widgetConfig.theme || config.ui.theme.default;
    window.theme = config.ui.theme;
    widgetConfig.theme = themeVariant;
    setSettings((old) => ({
      ...old,
      theme: themeVariant
    }));

    const _theme = overrideTheme(
      makeTheme(themeVariant || settings.theme, widgetConfig.fontFamily, {
        // Force mobile view
        values: {
          xs: 0,
          sm: 10000,
          md: 10000,
          lg: 10000,
          xl: 10000
        }
      })
    );
    if (!_theme.components) {
      _theme.components = {};
    }
    _theme.components = {
      ..._theme.components,
      MuiPopover: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      },
      MuiPopper: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      },
      MuiModal: {
        defaultProps: {
          container: window.cl_shadowRootElement
        }
      }
    };

    setTheme(_theme);

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

  if (!config || !theme) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Toaster
        className="toast"
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: theme.typography.fontFamily,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }
        }}
      />
      <Widget config={widgetConfig} />
    </ThemeProvider>
  );
}
