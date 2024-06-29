export interface IStarter {
  label: string;
  message: string;
  icon?: string;
}

export interface ChatProfile {
  default: boolean;
  icon?: string;
  name: string;
  markdown_description: string;
  starters?: IStarter[];
}

export interface IAudioConfig {
  enabled: boolean;
  min_decibels: number;
  initial_silence_timeout: number;
  silence_timeout: number;
  chunk_duration: number;
  max_duration: number;
}

export interface IChainlitConfig {
  markdown?: string;
  ui: {
    name: string;
    description?: string;
    default_collapse_content?: boolean;
    github?: string;
    theme: any;
    custom_css?: string;
    custom_js?: string;
    custom_font?: string;
    custom_meta_image_url?: string;
  };
  features: {
    spontaneous_file_upload?: {
      enabled?: boolean;
      max_size_mb?: number;
      max_files?: number;
      accept?: string[] | Record<string, string[]>;
    };
    audio: IAudioConfig;
    unsafe_allow_html?: boolean;
    latex?: boolean;
    edit_message?: boolean;
  };
  debugUrl?: string;
  userEnv: string[];
  dataPersistence: boolean;
  threadResumable: boolean;
  chatProfiles: ChatProfile[];
  starters?: IStarter[];
  translation: object;
}
