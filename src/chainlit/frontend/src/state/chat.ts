import { atom } from "recoil";

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
  createdAt: number;
  messages: {
    content: string;
  }[];
}

export interface IMessage {
  id?: number;
  author: string;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  content: string;
  createdAt: number;
  humanFeedback?: number;
  language?: string;
  indent?: number;
  isError?: boolean;
  prompt?: string;
  llmSettings?: ILLMSettings;
}

export interface INestedMessage extends IMessage {
  subMessages?: IMessage[];
}

export interface IAsk {
  callback: (payload: any) => void;
  spec: {
    type: "text" | "file",
    timeout: number,
    accept?: string[],
    max_size_mb?: number,
  };
}

export const messagesState = atom<IMessage[]>({
  key: "Messages",
  dangerouslyAllowMutability: true,
  default: [],
});

export const tokenCountState = atom<number>({
  key: "TokenCount",
  default: 0,
});

export const loadingState = atom<boolean>({
  key: "Loading",
  default: false,
});

export const historyOpenedState = atom<boolean>({
  key: "HistoryOpened",
  default: false,
});

export const askUserState = atom<IAsk | undefined>({
  key: "AskUser",
  default: undefined,
});
