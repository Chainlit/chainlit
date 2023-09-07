import { IPrompt, TFormInput } from '@chainlit/components';

export interface ILLMProvider {
  id: string;
  inputs: TFormInput[];
  name: string;
  settings: ILLMSettings;
  is_chat: boolean;
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

export type PromptMode = 'Template' | 'Formatted';

export interface IPlayground {
  providers?: ILLMProvider[];
  prompt?: IPrompt;
  originalPrompt?: IPrompt;
}
