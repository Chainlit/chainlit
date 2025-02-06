import { ICallFn, ICommand, IMessageElement } from 'src/types';
import { WavRecorder, WavStreamPlayer } from 'src/wavtools';
import { create } from 'zustand';

import { stateOrSetter } from './utils';

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
      | { title: string; elements: IMessageElement[] }
      | ((old?: { title: string; elements: IMessageElement[] }) =>
          | {
              title: string;
              elements: IMessageElement[];
            }
          | undefined)
  ) => void;
  setChatProfile: (chatProfile: string) => void;
  resetChatSettingsInputs: () => void;
  resetChatSettingsValue: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  isAiSpeaking: false,
  audioConnection: 'off',
  loading: false,
  wavStreamPlayer: new WavStreamPlayer(),
  wavRecorder: new WavRecorder(),
  commands: [],
  chatSettingsInputs: [],
  chatSettingsValue: [].reduce(
    (form: { [key: string]: any }, input: any) => (
      (form[input.id] = input.initial), form
    ),
    {}
  ),
  chatSettingsDefaultValue: [].reduce(
    (form: { [key: string]: any }, input: any) => (
      (form[input.id] = input.initial), form
    ),
    {}
  ),

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
