import { makeApiClient } from 'api';
import App from 'app';
import { WidgetContext } from 'context';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';

i18nSetupLocalization();
interface Props {
  config: IWidgetConfig;
  resetChatOnMount: boolean;
}

export default function AppWrapper({ config, resetChatOnMount }: Props) {
  const apiClient = makeApiClient(config.chainlitServer);

  return (
    <RecoilRoot>
      <WidgetContext.Provider
        value={{
          accessToken: config.accessToken,
          apiClient,
          config
        }}
      >
        <App config={config} resetChatOnMount={resetChatOnMount} />
      </WidgetContext.Provider>
    </RecoilRoot>
  );
}
