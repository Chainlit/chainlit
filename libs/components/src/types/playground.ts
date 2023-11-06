import { TFormInput } from 'src/inputs';

import { IPrompt } from 'src/types/message';

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

export interface IFunction {
  name: string;
  description: string;
  parameters: {
    required: string[];
    properties: Record<string, { title: string; type: string }>;
  };
}

export type PromptMode = 'Template' | 'Formatted';

export interface IPlayground {
  providers?: ILLMProvider[];
  prompt?: IPrompt;
  originalPrompt?: IPrompt;
}
