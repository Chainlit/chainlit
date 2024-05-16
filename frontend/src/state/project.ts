import { atom } from 'recoil';

import { IStep } from '@chainlit/react-client';

export interface ChatProfile {
  default: boolean;
  icon: string;
  name: string;
  markdown_description: string;
}

export interface IProjectSettings {
  markdown?: string;
  ui: {
    name: string;
    show_readme_as_default?: boolean;
    description?: string;
    hide_cot?: boolean;
    default_collapse_content?: boolean;
    default_expand_messages?: boolean;
    github?: string;
    theme: any;
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
  userEnv: string[];
  dataPersistence: boolean;
  threadResumable: boolean;
  chatProfiles: ChatProfile[];
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
