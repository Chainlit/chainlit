import { makeApiClient } from 'api';
import { useEffect, useState } from 'react';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import { ChainlitContext } from '@chainlit/react-client';

import App from './app';

i18nSetupLocalization();
interface Props {
  widgetConfig: IWidgetConfig;
}

export default function AppWrapper({ widgetConfig }: Props) {
  const apiClient = makeApiClient(widgetConfig.chainlitServer);
  const [customThemeLoaded, setCustomThemeLoaded] = useState(false);

  useEffect(() => {
    apiClient
      .get('/public/theme.json')
      .then(async (res) => {
        try {
          const customTheme = await res.json();
          // todo handle fonts
          if (customTheme.variables) {
            window.theme = customTheme.variables;
          }
        } finally {
          setCustomThemeLoaded(true);
        }
      })
      .catch(() => setCustomThemeLoaded(true));
  }, []);

  if (!customThemeLoaded) return null;

  return (
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <App widgetConfig={widgetConfig} />
      </RecoilRoot>
    </ChainlitContext.Provider>
  );
}
