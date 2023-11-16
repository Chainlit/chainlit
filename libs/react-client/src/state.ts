import isEqual from 'lodash/isEqual';
import { DefaultValue, atom, selector } from 'recoil';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

import {
  ConversationsHistory,
  IAction,
  IAppUser,
  IAsk,
  IAvatarElement,
  IMessage,
  IMessageElement,
  ITasklistElement,
  Role
} from './types';
import { groupByDate } from './utils/group';

export interface ISession {
  socket: Socket;
  error?: boolean;
}

export const conversationIdToResumeState = atom<string | undefined>({
  key: 'ConversationIdToResume',
  default: undefined
});

export const chatProfileState = atom<string | undefined>({
  key: 'ChatProfile',
  default: undefined
});

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

export const chatSettingsInputsState = atom<any>({
  key: 'ChatSettings',
  default: []
});

export const chatSettingsDefaultValueSelector = selector({
  key: 'ChatSettingsValue/Default',
  get: ({ get }) => {
    const chatSettings = get(chatSettingsInputsState);
    return chatSettings.reduce(
      (form: { [key: string]: any }, input: any) => (
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

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

export const roleState = atom<Role>({
  key: 'Role',
  default: undefined
});

export const userState = atom<IAppUser | null>({
  key: 'User',
  default: null
});

export const conversationsHistoryState = atom<ConversationsHistory | undefined>(
  {
    key: 'ConversationsHistory',
    default: {
      conversations: undefined,
      currentConversationId: undefined,
      groupedConversations: undefined,
      pageInfo: undefined
    },
    effects: [
      ({ setSelf, onSet }: { setSelf: any; onSet: any }) => {
        onSet(
          (
            newValue: ConversationsHistory | undefined,
            oldValue: ConversationsHistory | undefined
          ) => {
            let groupedConversations = newValue?.groupedConversations;

            if (
              newValue?.conversations &&
              !isEqual(newValue.conversations, oldValue?.groupedConversations)
            ) {
              groupedConversations = groupByDate(newValue.conversations);
            }

            setSelf({
              ...newValue,
              groupedConversations
            });
          }
        );
      }
    ]
  }
);
