import { ICallFn, ICommand, IMessageElement } from 'src/types';
import { WavRecorder, WavStreamPlayer } from 'src/wavtools';
import { create } from 'zustand';

import { stateOrSetter } from './utils';

// import { subscribeWithSelector } from 'zustand/middleware/subscribeWithSelector';

interface ChatState {
  isAiSpeaking: boolean;
  audioConnection: 'connecting' | 'on' | 'off';
  loading: boolean;
  wavStreamPlayer: WavStreamPlayer;
  wavRecorder: WavRecorder;
  callFn?: ICallFn;
  commands: ICommand[];
  sideView?: { title: string; elements: IMessageElement[] };
  chatProfile?: string;
  chatSettingsInputs: any[];
  chatSettingsDefaultValue: Record<any, any>;
  chatSettingsValue: Record<any, any>;

  setIsAiSpeaking: (isAiSpeaking: boolean) => void;
  setAudioConnection: (audioConnection: 'connecting' | 'on' | 'off') => void;
  setLoading: (loading: boolean) => void;
  setCallFn: (callFn?: ICallFn) => void;
  setCommands: (commands: ICommand[]) => void;
  setSideView: (
    sideViewOrSetter?:
      | { title: string; elements: IMessageElement[]; key?: string }
      | ((old?: {
          title: string;
          elements: IMessageElement[];
          key?: string;
        }) =>
          | {
              title: string;
              elements: IMessageElement[];
              key?: string;
            }
          | undefined)
  ) => void;
  setChatProfile: (chatProfile: string) => void;
  setChatSettingsInputs: (chatSettingsInputs: any[]) => void;
  setChatSettingsValue: (chatSettingsValue: Partial<Record<any, any>>) => void;
  resetChatSettingsInputs: () => void;
  resetChatSettingsValue: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isAiSpeaking: false as boolean,
  audioConnection: 'off',
  loading: false,
  wavStreamPlayer: new WavStreamPlayer(),
  wavRecorder: new WavRecorder(),
  commands: [],
  chatSettingsInputs: [],
  chatSettingsValue: {},
  chatSettingsDefaultValue: {},

  setIsAiSpeaking: (isAiSpeaking) => {
    set({ isAiSpeaking });
  },

  setAudioConnection: (audioConnection) => {
    set({ audioConnection });
  },

  setLoading: (loading) => {
    set({ loading });
  },

  setCallFn: (callFn) => {
    set({ callFn });
  },

  setCommands: (commands) => {
    set({ commands });
  },

  setSideView: (sideViewOrSetter) => {
    stateOrSetter(set, 'sideView', sideViewOrSetter);
  },

  setChatProfile: (chatProfile) => {
    set({ chatProfile });
  },

  setChatSettingsInputs: (chatSettingsInputs) => {
    // Collect default values of all inputs
    const chatSettingsDefaultValue = chatSettingsInputs.reduce(
      (form: { [key: string]: any }, input: any) => (
        (form[input.id] = input.initial), form
      ),
      {}
    );

    set({ chatSettingsInputs, chatSettingsDefaultValue });
  },

  setChatSettingsValue: (newValue) => {
    set(({ chatSettingsValue }) => ({
      chatSettingsValue: { ...chatSettingsValue, ...newValue }
    }));
  },

  resetChatSettingsInputs: () => {
    set({ chatSettingsInputs: [] });
  },

  resetChatSettingsValue: () => {
    const chatSettingsValue = get().chatSettingsInputs.reduce(
      (form: { [key: string]: any }, input: any) => (
        (form[input.id] = input.initial), form
      ),
      {}
    );

    set({ chatSettingsValue });
  }
}));
