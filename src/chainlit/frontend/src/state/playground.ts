import { atom } from 'recoil';

import { IPrompt } from './chat';

export const playgroundState = atom<IPrompt | undefined>({
  key: 'Playground',
  default: undefined
});
