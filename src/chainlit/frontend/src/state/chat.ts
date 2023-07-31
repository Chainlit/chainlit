import { atom, selector } from 'recoil';
import { Socket } from 'socket.io-client';

import { TFormInput, TFormInputValue } from 'components/organisms/FormInput';

import { IMessageElement } from './element';
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
  prompt?: string;
  llmSettings?: ILLMSettings;
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
      (
        form: { [key: string]: any },
        input: TFormInput & { initial?: TFormInputValue }
      ) => ((form[input.id] = input.initial), form),
      {}
    );
  }
});

export const chatSettingsValueState = atom({
  key: 'ChatSettingsValue',
  default: chatSettingsDefaultValueSelector
});
