import { DefaultValue, atom, selector } from 'recoil';
import { Socket } from 'socket.io-client';
import { TFormInput } from 'src/inputs';
import {
  IAction,
  IAsk,
  IAvatarElement,
  IMessage,
  IMessageElement,
  ITasklistElement
} from 'src/types';
import { v4 as uuidv4 } from 'uuid';

export interface ISession {
  socket: Socket;
  error?: boolean;
}

const sessionIdAtom = atom<string>({
  key: 'SessionId',
  default: uuidv4()
});

export const sessionIdState = selector({
  key: 'SessionIdSelector',
  get: ({ get }) => get(sessionIdAtom),
  set: ({ set }, newValue) =>
    set(sessionIdAtom, newValue instanceof DefaultValue ? uuidv4() : newValue)
});

export const sessionState = atom<ISession | undefined>({
  key: 'Session',
  dangerouslyAllowMutability: true,
  default: undefined
});

export const actionState = atom<IAction[]>({
  key: 'Actions',
  default: []
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

export const askUserState = atom<IAsk | undefined>({
  key: 'AskUser',
  default: undefined
});

export const chatSettingsInputsState = atom<TFormInput[]>({
  key: 'ChatSettings',
  default: []
});

export const chatSettingsDefaultValueSelector = selector({
  key: 'ChatSettingsValue/Default',
  get: ({ get }) => {
    const chatSettings = get(chatSettingsInputsState);
    return chatSettings.reduce(
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

export const elementState = atom<IMessageElement[]>({
  key: 'DisplayElements',
  default: []
});

export const avatarState = atom<IAvatarElement[]>({
  key: 'AvatarElements',
  default: []
});

export const tasklistState = atom<ITasklistElement[]>({
  key: 'TasklistElements',
  default: []
});

export const firstUserMessageState = atom<IMessage | undefined>({
  key: 'FirstUserMessage',
  default: undefined
});
