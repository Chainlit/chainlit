import { atom } from 'recoil';

import { IMessage, IMessageElement } from '@chainlit/components';

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
  };
  features: {
    multi_modal?: boolean;
  };
  userEnv: string[];
  dataPersistence: boolean;
  chatProfiles: ChatProfile[];
}

export const projectSettingsState = atom<IProjectSettings | undefined>({
  key: 'ProjectSettings',
  default: undefined
});

export const chatProfile = atom<string | undefined>({
  key: 'ChatProfile',
  default: undefined
});

export const sideViewState = atom<IMessageElement | undefined>({
  key: 'SideView',
  default: undefined
});

export const highlightMessage = atom<IMessage['id'] | null>({
  key: 'HighlightMessage',
  default: null
});

export const chatSettingsOpenState = atom<boolean>({
  key: 'chatSettingsOpen',
  default: false
});
