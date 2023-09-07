import { atom, selector } from 'recoil';

import { FileSpec, IAsk, IMessage, TFormInput } from '@chainlit/components';

import { ISession } from 'types/chat';

export const sessionState = atom<ISession | undefined>({
  key: 'Session',
  dangerouslyAllowMutability: true,
  default: undefined
});

export const messagesState = atom<IMessage[]>({
  key: 'Messages',
  dangerouslyAllowMutability: true,
  default: []
});

export const tokenCountState = atom<number>({
  key: 'TokenCount',
  default: 0
});

export const loadingState = atom<boolean>({
  key: 'Loading',
  default: false
});

export const fileSpecState = atom<FileSpec | undefined>({
  key: 'FileSpec',
  default: undefined
});

export const askUserState = atom<IAsk | undefined>({
  key: 'AskUser',
  default: undefined
});

export const highlightMessage = atom<IMessage['id'] | null>({
  key: 'HighlightMessage',
  default: null
});

export const chatSettingsState = atom<{
  open: boolean;
  inputs: TFormInput[];
}>({
  key: 'ChatSettings',
  default: {
    open: false,
    inputs: []
  }
});

export const chatSettingsDefaultValueSelector = selector({
  key: 'ChatSettingsValue/Default',
  get: ({ get }) => {
    const chatSettings = get(chatSettingsState);
    return chatSettings.inputs.reduce(
      (form: { [key: string]: any }, input: TFormInput) => (
        (form[input.id] = input.initial), form
      ),
      {}
    );
  }
});

export const chatSettingsValueState = atom({
  key: 'ChatSettingsValue',
  default: chatSettingsDefaultValueSelector
});
