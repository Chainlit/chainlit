import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';
import WidgetEmbedded from 'widget-embedded';

import { Theme, ThemeProvider } from '@mui/material/styles';

import { overrideTheme } from '@chainlit/app/src/App';
import { apiClientState } from '@chainlit/app/src/state/apiClient';
import {
  IProjectSettings,
  projectSettingsState
} from '@chainlit/app/src/state/project';
import { settingsState } from '@chainlit/app/src/state/settings';
import { useAuth, useChatInteract } from '@chainlit/react-client';
import { makeTheme } from '@chainlit/react-components/theme';
import { EvoyaConfig } from 'evoya/types';

interface Props {
  config: IWidgetConfig;
  evoya: EvoyaConfig;
}

export default function App({ config, evoya }: Props) {
  const { apiClient, accessToken } = useContext(WidgetContext);
  const { setAccessToken } = useAuth(apiClient);
  const [projectSettings, setProjectSettings] =
    useRecoilState(projectSettingsState);
  const setApiClient = useSetRecoilState(apiClientState);
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useState<Theme | null>(null);
  const { i18n } = useTranslation();
  const languageInUse = navigator.language || 'en-US';
  const { clear } = useChatInteract();

  useEffect(() => {
    setAccessToken(config.accessToken);
  }, [config.accessToken]);

  useEffect(() => {
    if (evoya.reset) {
      clear();
    }
    // window.addEventListener('chainlit-set-token', (event) => {
    //   setAccessToken(event.detail?.token);
    // });
    setApiClient(apiClient);
    if (!projectSettings) {
      apiClient
        .get(`/project/settings?language=${languageInUse}`, accessToken)
        .then((res) => res.json())
        .then((data: IProjectSettings) => {
          window.theme = data.ui.theme;
          data.ui.hide_cot = config.showCot ? data.ui.hide_cot : true;
          setSettings((old) => ({
            ...old,
            theme: config.theme ? config.theme : old.theme,
            hideCot: data.ui.hide_cot!
          }));

          const _theme = overrideTheme(
            makeTheme(config.theme || settings.theme, config.fontFamily, {
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
          setTheme(_theme);
          setProjectSettings(data);
          i18n.addResourceBundle(
            languageInUse,
            'translation',
            data.translation
          );
          i18n.changeLanguage(languageInUse);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, []);

  if (!projectSettings || !theme) {
    return null;
  }

  return (
    <ThemeProvider theme={theme}>
      <Toaster
        richColors
        className="toast show"
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: theme.typography.fontFamily,
            // background: theme.palette.background.paper,
            // border: `1px solid ${theme.palette.divider}`,
            // color: theme.palette.text.primary
          }
        }}
      />
      {evoya.type === 'default' ? <Widget config={config} /> : <WidgetEmbedded />}
    </ThemeProvider>
  );
}
