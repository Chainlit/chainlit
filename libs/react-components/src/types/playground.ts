import { TFormInput } from 'src/inputs';

import type { IGeneration } from 'client-types/';

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

export type PromptMode = 'Formatted';

export interface IPlayground {
  providers?: ILLMProvider[];
  generation?: IGeneration;
  originalGeneration?: IGeneration;
}
