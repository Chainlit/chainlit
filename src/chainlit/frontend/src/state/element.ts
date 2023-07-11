import { atom } from 'recoil';

export type IElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAvatarElement
  | ITasklistElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IElementContainer;

export type IDisplayElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IElementContainer;

export type IContainerElement =
  | IDisplayElement
  | ICheckboxElement
  | IRadioElement
  | ISelectBoxElement
  | ISliderElement
  | ITextInputElement
  | INumberInputElement;

export type ElementTypes = IElement['type'];

export type IElementSize = 'small' | 'medium' | 'large';

interface IElementBase<T> {
  type: T;
}

interface IContentElementBase<T> extends IElementBase<T> {
  id?: number;
  conversationId?: number;
  tempId?: string;
  name: string;
  forIds?: string[];
}

interface IDisplayContentElementBase<T> extends IContentElementBase<T> {
  display: 'inline' | 'side' | 'page';
  drawerWidth: number;
}

export interface IImageElement extends IDisplayContentElementBase<'image'> {
  url?: string;
  content?: ArrayBuffer;
  size?: IElementSize;
}

export interface IAvatarElement extends IContentElementBase<'avatar'> {
  url?: string;
  content?: ArrayBuffer;
}

export interface ITextElement extends IDisplayContentElementBase<'text'> {
  url?: string;
  content?: string;
  language?: string;
  drawerWidth: number;
}

export interface IPdfElement extends IDisplayContentElementBase<'pdf'> {
  url?: string;
  content?: string;
  drawerWidth: number;
}

export interface IAudioElement extends IDisplayContentElementBase<'audio'> {
  url?: string;
  content?: ArrayBuffer;
}

export interface IVideoElement extends IDisplayContentElementBase<'video'> {
  url?: string;
  content?: ArrayBuffer;
  size?: IElementSize;
}

export interface IFileElement extends IDisplayContentElementBase<'file'> {
  url?: string;
  content?: ArrayBuffer;
}

export interface ITasklistElement extends IContentElementBase<'tasklist'> {
  content?: string;
}

export interface IElementContainer
  extends IDisplayContentElementBase<'container'> {
  content?: IContainerElement[];
  drawerWidth: number;
}

export interface ICheckboxElement extends IElementBase<'checkbox'> {
  key: string;
  label: string;
  initial: boolean;
}

export interface IRadioElement extends IElementBase<'radio'> {
  key: string;
  label: string;
  options: string[];
  initial_index: number;
}

export interface ISelectBoxElement extends IElementBase<'selectbox'> {
  key: string;
  label: string;
  options: string[];
  initial_index: number;
}

export interface ISliderElement extends IElementBase<'slider'> {
  key: string;
  label: string;
  initial: number;
  min: number;
  max: number;
  step: number;
}

export interface ITextInputElement extends IElementBase<'textinput'> {
  key: string;
  label: string;
  initial: string;
  placeholder: string;
  max_chars: string;
}

export interface INumberInputElement extends IElementBase<'numberinput'> {
  key: string;
  label: string;
  initial: number;
  placeholder: string;
  decimal: boolean;
}

export const elementState = atom<IDisplayElement[]>({
  key: 'Elements',
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

export const sideViewState = atom<IDisplayElement | undefined>({
  key: 'SideView',
  default: undefined
});
