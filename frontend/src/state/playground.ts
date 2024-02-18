import { atom } from 'recoil';

import { IPlayground, PromptMode } from '@chainlit/react-components';

export const playgroundState = atom<IPlayground | undefined>({
  key: 'Playground',
  default: undefined
});

export const variableState = atom<string | undefined>({
  key: 'PlaygroundVariable',
  default: undefined
});

export const functionState = atom<number | undefined>({
  key: 'PlaygroundFunction',
  default: undefined
});

export const modeState = atom<PromptMode>({
  key: 'PlaygroundMode',
  default: 'Formatted'
});
