import { IMessageElement } from './element';

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
  id: string;
  author: string;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  content?: string;
  createdAt: number | string;
  humanFeedback?: number;
  disableHumanFeedback?: boolean;
  language?: string;
  indent?: number;
  parentId?: string;
  isError?: boolean;
  prompt?: IPrompt;
  streaming?: boolean;
}

export interface INestedMessage extends IMessage {
  subMessages?: IMessage[];
}

export interface IMessageContent {
  authorIsUser?: boolean;
  content?: string;
  elements: IMessageElement[];
  id?: string;
  language?: string;
  preserveSize?: boolean;
}
