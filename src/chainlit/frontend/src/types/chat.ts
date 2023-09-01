import { Socket } from 'socket.io-client';

import { IMessageElement } from './element';
import { IMember } from './user';

interface IBaseTemplate {
  template?: string;
  formatted?: string;
  template_format: string;
}

export type PromptMessageRole = 'system' | 'assistant' | 'user' | 'function';

export interface IPromptMessage extends IBaseTemplate {
  role: PromptMessageRole;
  name?: string;
}

export type ILLMSettings = Record<string, string | string[] | number | boolean>;

export interface IPrompt extends IBaseTemplate {
  provider: string;
  id?: string;
  inputs?: Record<string, string>;
  completion?: string;
  settings?: ILLMSettings;
  messages?: IPromptMessage[];
}

export interface IChat {
  id: number;
  createdAt: number | string;
  author?: IMember;
  messages: IMessage[];
  elements: IMessageElement[];
}

export interface IMessage {
  id: string;
  author: string;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  content?: string;
  createdAt: number | string;
  humanFeedback?: number;
  language?: string;
  indent?: number;
  parentId?: string;
  isError?: boolean;
  prompt?: IPrompt;
  streaming?: boolean;
}

export interface IMessageUpdate extends IMessage {
  newId?: string;
}

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
}

export interface INestedMessage extends IMessage {
  subMessages?: IMessage[];
}

export interface FileSpec {
  accept?: string[] | Record<string, string[]>;
  max_size_mb?: number;
  max_files?: number;
}

export interface IAskResponse {
  content: string;
  author: string;
}

export interface IFileResponse {
  name: string;
  path?: string;
  size: number;
  type: string;
  content: ArrayBuffer;
}

export interface IAsk {
  callback: (payload: IAskResponse | IFileResponse[]) => void;
  spec: {
    type: 'text' | 'file';
    timeout: number;
  } & FileSpec;
}

export interface ISession {
  socket: Socket;
  error?: boolean;
}
