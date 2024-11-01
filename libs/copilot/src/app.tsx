import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';
import WidgetEmbedded from 'widget-embedded';

import { Theme, ThemeProvider } from '@mui/material/styles';

import { overrideTheme } from '@chainlit/app/src/App';
import { useTranslation } from '@chainlit/app/src/components/i18n/Translator';
import { settingsState } from '@chainlit/app/src/state/settings';
import { makeTheme } from '@chainlit/app/src/theme';
import { ChainlitContext, useChatInteract, useAuth, useConfig, configState } from '@chainlit/react-client';
import { EvoyaConfig } from 'evoya/types';

interface Props {
  widgetConfig: IWidgetConfig;
  evoya: EvoyaConfig;
}

declare global {
  interface Window {
    cl_shadowRootElement: HTMLDivElement;
  }
}

export default function App({ widgetConfig, evoya }: Props) {
  const apiClient = useContext(ChainlitContext);
  const { accessToken } = useContext(WidgetContext);
  const { config } = useConfig(accessToken);
  const { setAccessToken } = useAuth();
  const [settings, setSettings] = useRecoilState(settingsState);
  const [recconfig, setConfig] = useRecoilState(configState);
  const [theme, setTheme] = useState<Theme | null>(null);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const { clear } = useChatInteract();

  useEffect(() => {
    setAccessToken(widgetConfig.accessToken);
  }, [widgetConfig.accessToken]);

  useEffect(() => {
    if (evoya.reset) {
      clear();
    }
    if (!config) return;

    const themeVariant = widgetConfig.theme || config.ui.theme.default;
    // const themeVariant = 'light';
    window.theme = config.ui.theme;
    widgetConfig.theme = themeVariant;
    setSettings((old) => ({
      ...old,
      theme: themeVariant
    }));

    const _theme = overrideTheme(
      makeTheme(themeVariant || settings.theme, widgetConfig.fontFamily, {
        values: {
          xs: 0,
          sm: 600,
          md: 900,
          lg: 1200,
          xl: 1536
        }
      }, {
        primary: {
          main: widgetConfig.button?.style?.bgcolor ?? '#ff2e4e',
          dark: widgetConfig.button?.style?.bgcolorHover ?? '#ff4764',
          // light: '#ff7d91',
          contrastText: widgetConfig.button?.style?.color ?? '#ffffff'
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
        richColors
        className="toast show"
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: theme.typography.fontFamily,
            // background: theme.palette.background.paper,
            // border: `1px solid ${theme.palette.divider}`,
            // color: theme.palette.text.primary
          },
          duration: 2000
        }}
      />
      {evoya.type === 'default' ? <Widget config={widgetConfig} /> : <WidgetEmbedded />}
    </ThemeProvider>
  );
}
