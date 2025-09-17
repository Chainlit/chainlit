export type IElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | ITasklistElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IPlotlyElement
  | IDataframeElement
  | IMapElement
  | ICustomElement;

export type IMessageElement =
  | IImageElement
  | ITextElement
  | IPdfElement
  | IAudioElement
  | IVideoElement
  | IFileElement
  | IPlotlyElement
  | IDataframeElement
  | IMapElement
  | ICustomElement;

export type ElementType = IElement['type'];
export type IElementSize = 'small' | 'medium' | 'large';

interface TElement<T> {
  id: string;
  type: T;
  threadId?: string;
  forId: string;
  mime?: string;
  url?: string;
  chainlitKey?: string;
}

interface TMessageElement<T> extends TElement<T> {
  name: string;
  display: 'inline' | 'side' | 'page';
}

export interface IImageElement extends TMessageElement<'image'> {
  size?: IElementSize;
}

export interface ITextElement extends TMessageElement<'text'> {
  language?: string;
}

export interface IPdfElement extends TMessageElement<'pdf'> {
  page?: number;
}

export interface IAudioElement extends TMessageElement<'audio'> {
  autoPlay?: boolean;
}

export interface IVideoElement extends TMessageElement<'video'> {
  size?: IElementSize;

  /**
   * Override settings for each type of player in ReactPlayer
   * https://github.com/cookpete/react-player?tab=readme-ov-file#config-prop
   * @type {object}
   */
  playerConfig?: object;
}

export interface IFileElement extends TMessageElement<'file'> {
  type: 'file';
}

export type IPlotlyElement = TMessageElement<'plotly'>;

export type ITasklistElement = TElement<'tasklist'>;

export type IDataframeElement = TMessageElement<'dataframe'>;

export interface IMapElement extends TMessageElement<'map'> {
  apiKey?: string;
  center?: {
    lat: number;
    lng: number;
  };
  zoom?: number;
  markers?: Array<{
    lat: number;
    lng: number;
    title?: string;
    description?: string;
  }>;
  height?: string;
  width?: string;
}

export interface ICustomElement extends TMessageElement<'custom'> {
  props: Record<string, unknown>;
}
