import { isEqual } from 'lodash';
import { groupByDate } from 'src/utils/group';
import { create } from 'zustand';

import { IAuthConfig, IUser, ThreadHistory } from '..';

interface AuthState {
  authConfig?: IAuthConfig;
  user?: IUser | null;

  threadHistory?: ThreadHistory;

  setAuthConfig: (authConfig?: IAuthConfig) => void;
  setUser: (user?: IUser | null) => void;
  setThreadHistory: (threadHistory?: ThreadHistory) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  threadHistory: {
    threads: undefined,
    currentThreadId: undefined,
    timeGroupedThreads: undefined,
    pageInfo: undefined
  },

  setAuthConfig: (authConfig?: IAuthConfig) => {
    set({ authConfig });
  },

  setUser: (user?: IUser | null) => {
    set({ user });
  },

  setThreadHistory: (threadHistory?: ThreadHistory) => {
    const oldValue = get().threadHistory;

    let timeGroupedThreads = threadHistory?.timeGroupedThreads;
    if (
      threadHistory?.threads &&
      !isEqual(threadHistory.threads, oldValue?.timeGroupedThreads)
    ) {
      timeGroupedThreads = groupByDate(threadHistory.threads);
    }

    set({
      threadHistory: {
        ...threadHistory,
        timeGroupedThreads
      }
    });
  }
}));
