export type GenerationMessageRole =
  | 'system'
  | 'assistant'
  | 'user'
  | 'function'
  | 'tool';
export type ILLMSettings = Record<string, string | string[] | number | boolean>;

export interface IGenerationMessage {
  template?: string;
  formatted?: string;
  templateFormat: string;
  role: GenerationMessageRole;
  name?: string;
}

export interface IFunction {
  name: string;
  description: string;
  parameters: {
    required: string[];
    properties: Record<string, { title: string; type: string }>;
  };
}

export interface ITool {
  type: string;
  function: IFunction;
}

export interface IBaseGeneration {
  provider: string;
  id?: string;
  inputs?: Record<string, string>;
  completion?: string;
  settings?: ILLMSettings;
  functions?: IFunction[];
  tokenCount?: number;
}

export interface ICompletionGeneration extends IBaseGeneration {
  type: 'COMPLETION';
  template?: string;
  formatted?: string;
  templateFormat: string;
}

export interface IChatGeneration extends IBaseGeneration {
  type: 'CHAT';
  messages?: IGenerationMessage[];
}

export type IGeneration = ICompletionGeneration | IChatGeneration;
