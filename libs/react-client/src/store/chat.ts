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
  chatSettingsDefaultValue: any;
  chatSettingsValue: any;

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
  setChatSettingsValue: (chatSettingsValue: any) => void;
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
  chatSettingsValue: [],
  chatSettingsDefaultValue: [],

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
    set({ chatSettingsInputs });
  },

  setChatSettingsValue: (chatSettingsValue) => {
    set({ chatSettingsValue });
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

// useChatStore.subscribe((state, prevState) => {
//   const chatSettingsDefaultValue = state.chatSettingsInputs.reduce(
//     (form: { [key: string]: any }, input: any) => (
//       (form[input.id] = input.initial), form
//     ),
//     {}
//   );
//
//   useChatStore.setState({chatSettingsDefaultValue });
// })
