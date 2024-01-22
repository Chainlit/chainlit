import { makeApiClient } from 'api';
import App from 'app';
import { WidgetContext } from 'context';
import { RecoilRoot } from 'recoil';
import { IWidgetConfig } from 'types';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';

i18nSetupLocalization();
interface Props {
  config: IWidgetConfig;
}

export default function AppWrapper({ config }: Props) {
  const apiClient = makeApiClient(config.chainlitServer);

  return (
    <RecoilRoot>
      <WidgetContext.Provider
        value={{
          accessToken: config.accessToken,
          apiClient
        }}
      >
        <App config={config} />
      </WidgetContext.Provider>
    </RecoilRoot>
  );
}
