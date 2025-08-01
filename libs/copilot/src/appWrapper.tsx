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
  const additionalQueryParams = widgetConfig?.additionalQueryParamsForAPI;
  const apiClient = makeApiClient(
    widgetConfig.chainlitServer,
    additionalQueryParams || {}
  );
  const [customThemeLoaded, setCustomThemeLoaded] = useState(false);

  function completeInitialization() {
    if (widgetConfig.customCssUrl) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = widgetConfig.customCssUrl;
      window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
    }
    setCustomThemeLoaded(true);
  }

  useEffect(() => {
    let fontLoaded = false;

    apiClient
      .get('/public/theme.json')
      .then(async (res) => {
        try {
          const customTheme = await res.json();
          if (customTheme.custom_fonts?.length) {
            fontLoaded = true;
            customTheme.custom_fonts.forEach((href: string) => {
              const linkEl = document.createElement('link');
              linkEl.rel = 'stylesheet';
              linkEl.href = href;
              window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
            });
          }
          if (customTheme.variables) {
            window.theme = customTheme.variables;
          }
        } finally {
          // If no custom font, default to Inter
          if (!fontLoaded) {
            const linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href =
              'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap';
            window.cl_shadowRootElement.getRootNode().appendChild(linkEl);
          }
          completeInitialization();
        }
      })
      .catch(() => completeInitialization());
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
