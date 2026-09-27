export type DisplayMode = 'floating' | 'sidebar';

export interface IWidgetConfig {
  chainlitServer: string;
  showCot?: boolean;
  accessToken?: string;
  theme?: 'light' | 'dark';
  button?: {
    containerId?: string;
    imageUrl?: string;
    className?: string;
  };
  customCssUrl?: string;
  additionalQueryParamsForAPI?: Record<string, string>;
  expanded?: boolean;
  language?: string;
  opened?: boolean;
  displayMode?: DisplayMode;
  // CSS selector for a viewport-filling host root (e.g. a full-screen map/dashboard
  // shell). In sidebar mode its width is constrained instead of nudging the body margin,
  // which a `100vw` / `position: absolute inset` layout would ignore.
  hostRoot?: string;
}
