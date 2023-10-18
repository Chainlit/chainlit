import { IFileElement, IMessageElement } from './element';

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

export interface IPrompt extends IBaseTemplate {
  provider: string;
  id?: string;
  inputs?: Record<string, string>;
  completion?: string;
  settings?: ILLMSettings;
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
}

export interface INestedMessage extends IMessage {
  subMessages?: IMessage[];
}

export interface IMessageContent {
  elements: IMessageElement[];
  message: IMessage;
  preserveSize?: boolean;
}
