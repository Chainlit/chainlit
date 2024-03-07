import { createContext } from 'react';

import { ChainlitAPI } from '@chainlit/react-client';

import { IWidgetConfig } from 'types';

interface IWidgetContext {
  accessToken?: string;
  apiClient: ChainlitAPI;
  config?: IWidgetConfig;
}

const defaultContext = {
  accessToken: undefined,
  apiClient: new ChainlitAPI('', 'copilot'),
  config: undefined
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
