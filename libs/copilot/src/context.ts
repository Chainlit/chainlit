import { createContext } from 'react';

interface IWidgetContext {
  accessToken?: string;
}

const defaultContext = {
  accessToken: undefined
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
