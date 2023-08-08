import { atom } from 'recoil';

import { TFormInput } from 'components/organisms/FormInput';

import { IPrompt } from './chat';

export interface ILLMProvider {
  id: string;
  inputs: TFormInput[];
  name: string;
  settings: ILLMSettings;
}

export interface ILLMSettings {
  settings: {
    $schema: string;
    $ref: string;
    definitions: {
      settingsSchema: {
        type: string;
        Properties: Record<string, any>;
      };
    };
  };
}

export interface IPlayground {
  providers?: ILLMProvider[];
  prompt?: IPrompt;
}

export const playgroundState = atom<IPlayground>({
  key: 'Playground',
  default: undefined
});

export const variableState = atom<string | undefined>({
  key: 'Variable',
  default: undefined
});
