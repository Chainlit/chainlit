import { IAsk } from 'src/types';
import { create } from 'zustand';

interface UserState {
  firstUserInteraction?: string;
  askUser?: IAsk;

  setFirstUserInteraction: (interaction?: string) => void;
  setAskUser: (ask?: IAsk) => void;
}

export const useUserState = create<UserState>((set) => ({
  setFirstUserInteraction: (interaction) => {
    set({ firstUserInteraction: interaction });
  },

  setAskUser: (ask) => {
    set({ askUser: ask });
  }
}));
