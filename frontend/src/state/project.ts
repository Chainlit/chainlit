import { atom } from 'recoil';

import { IMessageElement, IStep } from '@chainlit/react-client';

export interface ChatProfile {
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
    multi_modal?: boolean;
    unsafe_allow_html?: boolean;
    latex?: boolean;
    speech_to_text?: {
      enabled?: boolean;
      language?: string;
    };
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

export const sideViewState = atom<IMessageElement | undefined>({
  key: 'SideView',
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
