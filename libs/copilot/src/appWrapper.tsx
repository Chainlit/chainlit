import { makeApiClient } from 'api';
import App from 'app';
import { WidgetContext } from 'context';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';
import { EvoyaConfig } from 'evoya/types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';

i18nSetupLocalization();
interface Props {
  config: IWidgetConfig;
  evoya: EvoyaConfig;
}

export default function AppWrapper({ config, evoya }: Props) {
  const apiClient = makeApiClient(config.chainlitServer);

  return (
    <RecoilRoot>
      <WidgetContext.Provider
        value={{
          accessToken: config.accessToken,
          apiClient,
          config,
          evoya
        }}
      >
        <App config={config} evoya={evoya} />
      </WidgetContext.Provider>
    </RecoilRoot>
  );
}
