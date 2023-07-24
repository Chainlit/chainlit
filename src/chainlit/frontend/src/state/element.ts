import { atom } from 'recoil';

export type IElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAvatarElement
  | ITasklistElement
  | IAudioElement
  | IVideoElement
  | IFileElement;

export type IMessageElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAudioElement
  | IVideoElement
  | IFileElement;

export type ElementType = IElement['type'];
export type IElementSize = 'small' | 'medium' | 'large';

interface TElement<T> {
  id: string;
  type: T;
  conversationId?: string;
  forIds?: string[];
  url?: string;
}

interface TMessageElement<T> extends TElement<T> {
  name: string;
  display: 'inline' | 'side' | 'page';
}

export interface IImageElement extends TMessageElement<'image'> {
  content?: ArrayBuffer;
  size?: IElementSize;
}

export interface IAvatarElement extends TElement<'avatar'> {
  name: string;
  content?: ArrayBuffer;
}

export interface ITextElement extends TMessageElement<'text'> {
  content?: string;
  language?: string;
}

export interface IPdfElement extends TMessageElement<'pdf'> {
  content?: string;
}

export interface IAudioElement extends TMessageElement<'audio'> {
  content?: ArrayBuffer;
}

export interface IVideoElement extends TMessageElement<'video'> {
  content?: ArrayBuffer;
  size?: IElementSize;
}

export interface IFileElement extends TMessageElement<'file'> {
  type: 'file';
  content?: ArrayBuffer;
}

export interface ITasklistElement extends TElement<'tasklist'> {
  content?: string;
}

export const elementState = atom<IMessageElement[]>({
  key: 'DisplayElements',
  default: []
});

export const avatarState = atom<IAvatarElement[]>({
  key: 'AvatarElements',
  default: []
});

export const tasklistState = atom<ITasklistElement[]>({
  key: 'TasklistElements',
  default: []
});

export const sideViewState = atom<IMessageElement | undefined>({
  key: 'SideView',
  default: undefined
});
