import { makeApiClient } from 'api';
import App from 'app';
import { WidgetContext } from 'context';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';
import { EvoyaConfig } from 'evoya/types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import { ChainlitContext } from '@chainlit/react-client';

i18nSetupLocalization();
interface Props {
  widgetConfig: IWidgetConfig;
  evoya: EvoyaConfig;
}

export default function AppWrapper({ widgetConfig, evoya }: Props) {
  const apiClient = makeApiClient(widgetConfig.chainlitServer);

  return (
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
        <WidgetContext.Provider
          value={{
            accessToken: widgetConfig.accessToken,
            evoya
          }}
        >
          <App widgetConfig={widgetConfig} evoya={evoya} />
        </WidgetContext.Provider>
      </RecoilRoot>
    </ChainlitContext.Provider>
  );
}
