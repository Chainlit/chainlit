import { atom, selector } from 'recoil';
import { Socket } from 'socket.io-client';

import { TFormInput } from 'components/organisms/FormInput';

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

export const fileSpecState = atom<FileSpec | undefined>({
  key: 'FileSpec',
  default: undefined
});

export const askUserState = atom<IAsk | undefined>({
  key: 'AskUser',
  default: undefined
});

export const highlightMessage = atom<IMessage['id'] | null>({
  key: 'HighlightMessage',
  default: null
});

export const chatSettingsState = atom<{
  open: boolean;
  inputs: TFormInput[];
}>({
  key: 'ChatSettings',
  default: {
    open: false,
    inputs: []
  }
});

export const chatSettingsDefaultValueSelector = selector({
  key: 'ChatSettingsValue/Default',
  get: ({ get }) => {
    const chatSettings = get(chatSettingsState);
    return chatSettings.inputs.reduce(
      (form: { [key: string]: any }, input: TFormInput) => (
        (form[input.id] = input.initial), form
      ),
      {}
    );
  }
});

export const chatSettingsValueState = atom({
  key: 'ChatSettingsValue',
  default: chatSettingsDefaultValueSelector
});
