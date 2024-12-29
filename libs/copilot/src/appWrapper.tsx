import { makeApiClient } from 'api';
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

  return (
    <ChainlitContext.Provider value={apiClient}>
      <RecoilRoot>
          <App widgetConfig={widgetConfig} />
      </RecoilRoot>
    </ChainlitContext.Provider>
  );
}
