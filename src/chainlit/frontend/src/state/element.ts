import { atom } from "recoil";

export enum ElementType {
  img = "image",
  txt = "text",
}

export interface IElement {
  id?: string;
  url?: string;
  content?: any;
  name: string;
  type: ElementType;
  display: "inline" | "side" | "page";
}

export type IElements = Record<string, IElement>;

export const elementState = atom<IElements>({
  key: "Elements",
  default: {},
});

export const sideViewState = atom<IElement | undefined>({
  key: "SideView",
  default: undefined,
});
