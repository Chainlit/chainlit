export type GenerationMessageRole =
  | 'system'
  | 'assistant'
  | 'user'
  | 'function'
  | 'tool';
export type ILLMSettings = Record<string, string | string[] | number | boolean>;

export interface IGenerationMessage {
  content: string;
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
  model?: string;
  error?: string;
  id?: string;
  variables?: Record<string, string>;
  tags?: string[];
  settings?: ILLMSettings;
  tools?: ITool[];
  tokenCount?: number;
}

export interface ICompletionGeneration extends IBaseGeneration {
  type: 'COMPLETION';
  prompt?: string;
  completion?: string;
}

export interface IChatGeneration extends IBaseGeneration {
  type: 'CHAT';
  messages?: IGenerationMessage[];
  messageCompletion?: IGenerationMessage;
}

export type IGeneration = ICompletionGeneration | IChatGeneration;
