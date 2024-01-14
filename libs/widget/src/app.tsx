import { WidgetContext } from 'context';
import { useContext, useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { Toaster } from 'sonner';
import { IWidgetConfig } from 'types';
import Widget from 'widget';

import { Theme, ThemeProvider } from '@mui/material/styles';

import { overrideTheme } from '@chainlit/app/src/App';
import {
  IProjectSettings,
  projectSettingsState
} from '@chainlit/app/src/state/project';
import { settingsState } from '@chainlit/app/src/state/settings';
import { makeTheme } from '@chainlit/react-components/theme';

interface Props {
  config: IWidgetConfig;
}

export default function App({ config }: Props) {
  const { apiClient, accessToken } = useContext(WidgetContext);
  const [projectSettings, setProjectSettings] =
    useRecoilState(projectSettingsState);
  const [settings, setSettings] = useRecoilState(settingsState);
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    if (!projectSettings) {
      apiClient
        .get('/project/settings', accessToken)
        .then((res) => res.json())
        .then((data: IProjectSettings) => {
          window.theme = data.ui.theme;
          data.ui.hide_cot = true;
          if (config.theme) {
            setSettings((old) => ({ ...old, theme: config.theme! }));
          }
          const _theme = overrideTheme(
            makeTheme(config.theme || settings.theme, config.fontFamily)
          );
          setTheme(_theme);
          setProjectSettings(data);
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
        className="toast"
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: theme.typography.fontFamily,
            background: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary
          }
        }}
      />
      <Widget config={config} />
    </ThemeProvider>
  );
}
