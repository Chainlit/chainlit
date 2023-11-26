import { IFileElement } from './element';

interface IBaseTemplate {
  template?: string;
  formatted?: string;
  template_format: string;
}

export type PromptMessageRole = 'system' | 'assistant' | 'user' | 'function';
export type ILLMSettings = Record<string, string | string[] | number | boolean>;

export interface IPromptMessage extends IBaseTemplate {
  role: PromptMessageRole;
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

export interface IPrompt extends IBaseTemplate {
  provider: string;
  id?: string;
  inputs?: Record<string, string>;
  completion?: string;
  settings?: ILLMSettings;
  functions?: IFunction[];
  messages?: IPromptMessage[];
}

export interface IMessage {
  author: string;
  authorIsUser?: boolean;
  content?: string;
  createdAt: number | string;
  disableHumanFeedback?: boolean;
  elements?: IFileElement[];
  humanFeedback?: number;
  humanFeedbackComment?: string;
  id: string;
  indent?: number;
  isError?: boolean;
  language?: string;
  parentId?: string;
  prompt?: IPrompt;
  streaming?: boolean;
  waitForAnswer?: boolean;
  subMessages?: IMessage[];
}
