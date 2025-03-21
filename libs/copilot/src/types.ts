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
}
