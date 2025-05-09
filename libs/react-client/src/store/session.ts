import { v4 as uuidv4 } from 'uuid';
import { create } from 'zustand';

import { ISession } from '../types';
import { stateOrSetter } from './utils';

interface SessionState {
  sessionId: string;
  session?: ISession;

  setState: (state: Partial<SessionState>) => void;
  setSession: (
    setterFnOrState: ((old?: ISession) => ISession) | ISession
  ) => void;
  resetSessionId: () => void;
}

export const useSessionState = create<SessionState>((set) => ({
  sessionId: uuidv4(),

  setState: (state) => set(state),
  setSession: (setterFnOrState) => {
    stateOrSetter(set, 'session', setterFnOrState);
  },

  resetSessionId: () => {
    set({ sessionId: uuidv4() });
  }
}));
