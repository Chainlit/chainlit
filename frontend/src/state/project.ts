import { atom } from 'recoil';

import { IMessage, IMessageElement, TFormInput } from '@chainlit/components';

export interface IProjectSettings {
  markdown?: string;
  ui: {
    name: string;
    description?: string;
    hide_cot?: boolean;
    default_collapse_content?: boolean;
    default_expand_messages?: boolean;
    github?: string;
  };
  userEnv: string[];
  dataPersistence: boolean;
}

export const projectSettingsState = atom<IProjectSettings | undefined>({
  key: 'ProjectSettings',
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
