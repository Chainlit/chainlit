import { atom } from 'recoil';

export enum ElementType {
  img = 'image',
  txt = 'text'
}

type ElementContentType = {
  [ElementType.img]: ArrayBuffer;
  [ElementType.txt]: string;
};

type ValueOf<T> = T[keyof T];

export interface IElement {
  id?: string;
  url?: string;
  type: ElementType;
  content?: ValueOf<ElementContentType>;
  name: string;
  display: 'inline' | 'side' | 'page';
}

export type IElements = Record<string, IElement>;

export const elementState = atom<IElements>({
  key: 'Elements',
  default: {}
});

export const sideViewState = atom<IElement | undefined>({
  key: 'SideView',
  default: undefined
});
