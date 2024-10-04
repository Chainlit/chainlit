import { createContext } from 'react';
import { EvoyaConfig } from 'evoya/types';

interface IWidgetContext {
  accessToken?: string;
  evoya?: EvoyaConfig;
}

const defaultContext = {
  accessToken: undefined,
  evoya: undefined
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
