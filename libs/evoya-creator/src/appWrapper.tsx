import { WidgetContext } from './context';
import { RecoilRoot } from 'recoil';

import { i18nSetupLocalization } from '@chainlit/app/src/i18n';
import { EvoyaCreatorConfig } from './types';
import CreatorFrame from './components/CreatorFrame';

i18nSetupLocalization();
interface Props {
  config: EvoyaCreatorConfig;
}

export default function AppWrapper({ config }: Props) {
  return (
    <RecoilRoot>
      <WidgetContext.Provider
        value={{
          config
        }}
      >
        <CreatorFrame />
      </WidgetContext.Provider>
    </RecoilRoot>
  );
}
