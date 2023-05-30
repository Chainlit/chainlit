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
  id?: number;
  tempId?: string;
  url?: string;
  content?: ValueOf<ElementContentType>;
  type: ElementType;
  name: string;
  display: 'inline' | 'side' | 'page';
  forId?: string;
}

export interface IImageElement extends IElement {
  type: ElementType.img;
  content?: ElementContentType[ElementType.img];
  size?: 'small' | 'medium' | 'large';
}

export interface ITextElement extends IElement {
  type: ElementType.txt;
  content?: ElementContentType[ElementType.txt];
  language?: string;
}

export type IElements = IElement[];

export const elementState = atom<IElements>({
  key: 'Elements',
  default: []
});

export const sideViewState = atom<IElement | undefined>({
  key: 'SideView',
  default: undefined
});
