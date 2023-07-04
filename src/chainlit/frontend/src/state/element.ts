import { atom } from 'recoil';

export type ElementType =
  | 'image'
  | 'text'
  | 'pdf'
  | 'avatar'
  | 'tasklist'
  | 'audio';

export type AllElements =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAvatarElement
  | ITasklistElement
  | IAudioElement;

export interface IElement {
  id?: number;
  conversationId?: number;
  tempId?: string;
  url?: string;
  type: ElementType;
  name: string;
  display: 'inline' | 'side' | 'page';
  forIds?: string[];
}

export interface IImageElement extends IElement {
  type: 'image';
  content?: ArrayBuffer;
  size?: 'small' | 'medium' | 'large';
}

export interface IAvatarElement extends IElement {
  type: 'avatar';
  content?: ArrayBuffer;
}

export interface ITextElement extends IElement {
  type: 'text';
  content?: string;
  language?: string;
}
export interface IPdfElement extends IElement {
  type: 'pdf';
  content?: string;
}

export interface IAudioElement extends IElement {
  type: 'audio';
  content?: ArrayBuffer;
}

export interface ITasklistElement extends IElement {
  type: 'tasklist';
  content?: string;
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
