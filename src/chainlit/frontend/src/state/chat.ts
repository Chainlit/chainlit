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

export interface IMessage {
  id?: number;
  author: string;
  authorIsUser?: boolean;
  waitForAnswer?: boolean;
  content: string;
  humanFeedback?: number;
  language?: string;
  indent?: number;
  final?: boolean;
  isError?: boolean;
  prompt?: string;
  llmSettings?: ILLMSettings;
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

export const displayStepsState = atom<boolean>({
  key: "DisplaySteps",
  default: false,
});

export const historyOpenedState = atom<boolean>({
  key: "HistoryOpened",
  default: false,
});
