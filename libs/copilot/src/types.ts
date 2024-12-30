export interface IWidgetConfig {
  chainlitServer: string;
  showCot?: boolean;
  accessToken?: string;
  theme?: 'light' | 'dark';
  fontFamily?: string;
  button?: {
    containerId?: string;
    imageUrl?: string;
    tailwindClassname?: string;
  };
}
