import { createContext } from 'react';

import { ChainlitAPI } from '@chainlit/react-client';

interface IWidgetContext {
  accessToken?: string;
  apiClient: ChainlitAPI;
}

const defaultContext = {
  accessToken: undefined,
  apiClient: new ChainlitAPI('', 'copilot')
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
