import { createContext } from 'react';

import { ChainlitAPI } from '@chainlit/react-client';

import { IWidgetConfig } from 'types';
import { EvoyaConfig } from 'evoya/types';

interface IWidgetContext {
  accessToken?: string;
  apiClient: ChainlitAPI;
  config?: IWidgetConfig;
  evoya?: EvoyaConfig;
}

const defaultContext = {
  accessToken: undefined,
  apiClient: new ChainlitAPI('', 'copilot'),
  config: undefined,
  evoya: undefined
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
