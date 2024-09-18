import { atom } from 'recoil';

import { IStep } from '@chainlit/react-client';

export const highlightMessage = atom<IStep['id'] | null>({
  key: 'HighlightMessage',
  default: null
});

export const chatSettingsOpenState = atom<boolean>({
  key: 'chatSettingsOpen',
  default: false
});

export const newAssistantOpenState = atom<boolean>({
  key: 'newAssistantOpen',
  default: false
});

export interface Assistant {
  input_widgets: any[];
  settings_values: Record<any, any>;
}

export const assistantsState = atom<Assistant[]>({
  key: 'Assistants',
  default: []
});

export const selectedAssistantState = atom<Assistant | null>({
  key: 'SelectedAssistant',
  default: null
});
