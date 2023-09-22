import { createContext } from 'react';

import { IPlaygroundContext } from 'src/types/playgroundContext';

const defaultPlaygroundContext: IPlaygroundContext = {
  setVariableName: () => undefined,
  setPromptMode: () => undefined,
  setPlayground: () => undefined,
  onNotification: () => undefined,
  promptMode: 'Template'
};

const PlaygroundContext = createContext<IPlaygroundContext>(
  defaultPlaygroundContext
);

export { PlaygroundContext, defaultPlaygroundContext };
