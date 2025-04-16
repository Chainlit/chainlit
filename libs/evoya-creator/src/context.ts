import { createContext } from 'react';
import { EvoyaCreatorConfig } from './types';

interface WidgetContext {
  config?: EvoyaCreatorConfig;
}

const defaultContext = {
  config: undefined
};

const WidgetContext = createContext<WidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
