import { isEqual } from 'lodash';
import { DefaultValue, atom, selector } from 'recoil';
import { Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';

import {
  IAction,
  IAsk,
  IAvatarElement,
  ICallFn,
  IMessageElement,
  IStep,
  ITasklistElement,
  IUser,
  ThreadHistory
} from './types';
import { groupByDate } from './utils/group';

export interface ISession {
  socket: Socket;
  error?: boolean;
}

export const threadIdToResumeState = atom<string | undefined>({
  key: 'ThreadIdToResume',
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

export const messagesState = atom<IStep[]>({
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

export const callFnState = atom<ICallFn | undefined>({
  key: 'CallFn',
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

export const firstUserInteraction = atom<string | undefined>({
  key: 'FirstUserInteraction',
  default: undefined
});

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

export const userState = atom<IUser | null>({
  key: 'User',
  default: null
});

export const threadHistoryState = atom<ThreadHistory | undefined>({
  key: 'ThreadHistory',
  default: {
    threads: undefined,
    currentThreadId: undefined,
    timeGroupedThreads: undefined,
    pageInfo: undefined
  },
  effects: [
    ({ setSelf, onSet }: { setSelf: any; onSet: any }) => {
      onSet(
        (
          newValue: ThreadHistory | undefined,
          oldValue: ThreadHistory | undefined
        ) => {
          let timeGroupedThreads = newValue?.timeGroupedThreads;
          if (
            newValue?.threads &&
            !isEqual(newValue.threads, oldValue?.timeGroupedThreads)
          ) {
            timeGroupedThreads = groupByDate(newValue.threads);
          }

          setSelf({
            ...newValue,
            timeGroupedThreads
          });
        }
      );
    }
  ]
});
