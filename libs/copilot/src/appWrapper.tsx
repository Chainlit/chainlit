import { makeApiClient } from 'api';
import App from 'app';
import { WidgetContext } from 'context';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import { ChainlitContext } from '@chainlit/react-client';

i18nSetupLocalization();
interface Props {
  widgetConfig: IWidgetConfig;
}

export default function AppWrapper({ widgetConfig }: Props) {
  const apiClient = makeApiClient(widgetConfig.chainlitServer);

  return (
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <WidgetContext.Provider
          value={{
            accessToken: widgetConfig.accessToken
          }}
        >
          <App widgetConfig={widgetConfig} />
        </WidgetContext.Provider>
      </RecoilRoot>
    </ChainlitContext.Provider>
  );
}
