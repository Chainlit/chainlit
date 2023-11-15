import { TFormInput } from 'src/inputs';

import { IPrompt } from '@chainlit/react-client';

export interface ILLMProvider {
  id: string;
  inputs: TFormInput[];
  name: string;
  settings: ILLMProviderSettings;
  is_chat: boolean;
}

export interface ILLMProviderSettings {
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

export type PromptMode = 'Template' | 'Formatted';

export interface IPlayground {
  providers?: ILLMProvider[];
  prompt?: IPrompt;
  originalPrompt?: IPrompt;
}
