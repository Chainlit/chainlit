import { atom } from 'recoil';
import { Socket } from 'socket.io-client';

import { IElement } from './element';
import { IMember } from './user';

export interface ILLMSettings {
  model_name: string;
  stop: string[] | string;
  temperature: number;
  max_tokens: number;
  top_p: number;
  frequency_penalty: number;
  presence_penalty: number;
}

export interface IChat {
  id: number;
  createdAt: number | string;
  author?: IMember;
  messages: IMessage[];
  elements: IElement[];
}

export interface IMessage {
  id?: number;
  tempId?: string;
  author: string;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  content?: string;
  createdAt: number | string;
  humanFeedback?: number;
  language?: string;
  indent?: number;
  isError?: boolean;
  prompt?: string;
  llmSettings?: ILLMSettings;
}

export interface IToken {
  id: number | string;
  token: string;
  isSequence: boolean;
}

export interface INestedMessage extends IMessage {
  subMessages?: IMessage[];
}

export interface IAskResponse {
  content: string;
  author: string;
}

export interface IAskFileResponse {
  name: string;
  path?: string;
  size: number;
  type: string;
  content: ArrayBuffer;
}

export interface IAsk {
  callback: (payload: IAskResponse | IAskFileResponse[]) => void;
  spec: {
    type: 'text' | 'file';
    timeout: number;
    accept?: string[] | Record<string, string[]>;
    max_size_mb?: number;
    max_files?: number;
  };
}

export interface ISession {
  socket: Socket;
  error?: boolean;
}

export const sessionState = atom<ISession | undefined>({
  key: 'Session',
  dangerouslyAllowMutability: true,
  default: undefined
});

export const messagesState = atom<IMessage[]>({
  key: 'Messages',
  dangerouslyAllowMutability: true,
  default: []
});

export const tokenCountState = atom<number>({
  key: 'TokenCount',
  default: 0
});

export const loadingState = atom<boolean>({
  key: 'Loading',
  default: false
});

export const historyOpenedState = atom<boolean>({
  key: 'HistoryOpened',
  default: false
});

export const askUserState = atom<IAsk | undefined>({
  key: 'AskUser',
  default: undefined
});

export const highlightMessage = atom<
  IMessage['id'] | IMessage['tempId'] | null
>({
  key: 'HighlightMessage',
  default: null
});
