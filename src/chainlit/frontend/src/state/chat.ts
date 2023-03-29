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

export interface IPlaygroundState {
  llmSettings: ILLMSettings;
  prompt: string;
  completion: string;
}

export interface IMessage {
  author: string;
  authorIsUser?: boolean;
  content: string;
  language?: string;
  indent?: number;
  final?: boolean;
  isError?: boolean;
  prompt?: string;
  llmSettings?: ILLMSettings;
}

export enum DocumentType {
  img = "image",
  txt = "text",
}

export interface IDocument {
  id?: string;
  url?: string;
  content?: any;
  name: string;
  type: DocumentType;
  display: "embed" | "side" | "fullscreen";
}

export type IDocuments = Record<string, IDocument>;

export interface IAgent {
  id: string;
  display: string;
  description: string;
}

export interface IDatasetFilters {
  authorEmail?: string;
  search?: string;
  feedback?: number;
}

export const messagesState = atom<IMessage[]>({
  key: "Messages",
  default: [],
});

export const documentsState = atom<IDocuments>({
  key: "Documents",
  default: {},
});

export const tokenCountState = atom<number>({
  key: "TokenCount",
  default: 0,
});

export const debugState = atom<any[]>({
  key: "Debug",
  default: [],
});

export const loadingState = atom<boolean>({
  key: "Loading",
  default: false,
});

export const displayStepsState = atom<boolean>({
  key: "DisplaySteps",
  default: false,
});

export const agentState = atom<IAgent[] | undefined>({
  key: "Agent",
  default: undefined,
});

export const playgroundState = atom<IPlaygroundState | undefined>({
  key: "Playground",
  default: undefined,
});

export const documentSideViewState = atom<IDocument | undefined>({
  key: "DocumentSideView",
  default: undefined,
});

export const playgroundSettingsState = atom<ILLMSettings | undefined>({
  key: "PlaygroundSettings",
  default: undefined,
});

export const projectSettingsState = atom<
  | { anonymous: boolean; chainlitServer: string; projectId?: string }
  | undefined
>({
  key: "ProjectSettings",
  default: undefined,
});

export const accessTokenState = atom<string | undefined>({
  key: "AccessToken",
  default: undefined,
});

export const datasetFiltersState = atom<IDatasetFilters>({
  key: "DatasetFilters",
  default: {},
});
