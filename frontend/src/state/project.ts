import { atom } from 'recoil';

import { IStep } from '@chainlit/react-client';

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

export interface IProjectSettings {
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
    audio: {
      enabled: boolean;
      min_decibels: number;
      initial_silence_timeout: number;
      silence_timeout: number;
      sample_rate: number;
      chunk_duration: number;
      max_duration: number;
    };
    unsafe_allow_html?: boolean;
    latex?: boolean;
  };
  debugUrl?: string;
  userEnv: string[];
  dataPersistence: boolean;
  threadResumable: boolean;
  chatProfiles: ChatProfile[];
  starters?: IStarter[];
  translation: object;
}

export const projectSettingsState = atom<IProjectSettings | undefined>({
  key: 'ProjectSettings',
  default: undefined
});

export const highlightMessage = atom<IStep['id'] | null>({
  key: 'HighlightMessage',
  default: null
});

export const chatSettingsOpenState = atom<boolean>({
  key: 'chatSettingsOpen',
  default: false
});
