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
  content: string;
  language?: string;
  indent?: number;
  final?: boolean;
  is_error?: boolean;
  prompt?: string;
  llm_settings?: ILLMSettings;
}

export enum DocumentType {
  img = "image",
  txt = "text",
}

export interface IDocumentSpec {
  name: string;
  display: "embed" | "side" | "fullscreen";
  type: DocumentType;
}

export interface IDocument {
  content: any;
  spec: IDocumentSpec;
}

export type IDocuments = Record<string, IDocument>;

export interface IAgent {
  id: string;
  display: string;
  description: string;
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

export const authState = atom<
  { anonymous: boolean; projectId?: string } | undefined
>({
  key: "ProjectId",
  default: undefined,
});

export const accessTokenState = atom<string | undefined>({
  key: "AccessToken",
  default: undefined,
});
