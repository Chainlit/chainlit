import { createContext } from 'react';

interface IWidgetContext {
  accessToken?: string;
  sendCookies?: boolean;
}

const defaultContext = {
  accessToken: undefined,
  sendCookies: false
};

const WidgetContext = createContext<IWidgetContext>(defaultContext);

export { WidgetContext, defaultContext };
