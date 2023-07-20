import { atom } from 'recoil';

export type ElementType =
  | 'image'
  | 'text'
  | 'pdf'
  | 'avatar'
  | 'tasklist'
  | 'audio'
  | 'video'
  | 'file';

export type AllElements =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAvatarElement
  | ITasklistElement
  | IAudioElement
  | IVideoElement
  | IFileElement;

export type IElementSize = 'small' | 'medium' | 'large';

export interface IElement {
  id: string;
  conversationId?: string;
  url?: string;
  type: ElementType;
  name: string;
  display: 'inline' | 'side' | 'page';
  forIds?: string[];
}

export interface IImageElement extends IElement {
  type: 'image';
  content?: ArrayBuffer;
  size?: IElementSize;
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

export interface IVideoElement extends IElement {
  type: 'video';
  content?: ArrayBuffer;
  size?: IElementSize;
}

export interface IFileElement extends IElement {
  type: 'file';
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
