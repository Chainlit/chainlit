import { atom } from "recoil";

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

export const documentsState = atom<IDocuments>({
  key: "Documents",
  default: {},
});

export const documentSideViewState = atom<IDocument | undefined>({
  key: "DocumentSideView",
  default: undefined,
});
