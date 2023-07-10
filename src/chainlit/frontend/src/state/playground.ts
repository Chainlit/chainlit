import { atom } from 'recoil';

import { ILLMSettings } from './chat';

export interface IPlaygroundState {
  llmSettings?: ILLMSettings;
  prompt: string;
  completion: string;
}

export const playgroundState = atom<IPlaygroundState | undefined>({
  key: 'Playground',
  default: undefined
});

export const playgroundSettingsState = atom<ILLMSettings | undefined>({
  key: 'PlaygroundSettings',
  default: undefined
});
