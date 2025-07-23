export interface BokehEmbed {
  embed_item: (doc: any, target: string) => void;
}

export interface BokehStatic {
  embed: BokehEmbed;
}

declare global {
  interface Window {
    Bokeh?: BokehStatic;
  }
}

export {}; 