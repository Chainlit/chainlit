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
  id?: number;
  author: string;
  authorIsUser?: boolean;
  waitForUser?: boolean;
  content: string;
  humanFeedback?: number;
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
  display: "inline" | "side" | "page";
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
  dangerouslyAllowMutability: true,
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

export const projectSettingsState = atom<{
      public: boolean;
      chainlitServer: string;
      projectId?: string;
      stoppable: boolean;
      userEnv?: string[];
      chainlitMd?: string;
      dev: boolean;
    } | undefined
>({
  key: "ProjectSettings",
  default: undefined,
});

export const accessTokenState = atom<string | undefined>({
  key: "AccessToken",
  default: undefined,
});

export const roleState = atom<"USER" | "ADMIN" | "OWNER" | "ANONYMOUS" | undefined>({
  key: "Role",
  default: undefined,
});

const localUserEnv = localStorage.getItem("userEnv")

export const userEnvState = atom<Record<string, string>>({
  key: "UserEnv",
  default: localUserEnv ? JSON.parse(localUserEnv) : {},
});

export const datasetFiltersState = atom<IDatasetFilters>({
  key: "DatasetFilters",
  default: {},
});

export const historyOpenedState = atom<boolean>({
  key: "HistoryOpened",
  default: false,
});
