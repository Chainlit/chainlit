import { IAction, IMessageElement, IStep, ITasklistElement } from 'src/types';
import { create } from 'zustand';

import { stateOrSetter } from './utils';

interface MessagesState {
  messages: IStep[];
  elements: IMessageElement[];
  taskList: ITasklistElement[];
  actions: IAction[];
  chatInputs: any[];
  tokenCount: number;

  setMessages: (setterFnOrItems: ((old: IStep[]) => IStep[]) | IStep[]) => void;
  setElements: (
    setterFnOrItems:
      | ((old: IMessageElement[]) => IMessageElement[])
      | IMessageElement[]
  ) => void;
  setTaskList: (
    setterFnOrItems:
      | ((old: ITasklistElement[]) => ITasklistElement[])
      | ITasklistElement[]
  ) => void;
  setActions: (
    setterFnOrItems: ((old: IAction[]) => IAction[]) | IAction[]
  ) => void;
  setChatInputs: (chatInputs: any[]) => void;
  setTokenCount: (setterFnOrCount: ((old: number) => number) | number) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  messages: [],
  elements: [],
  taskList: [],
  actions: [],
  chatInputs: [],
  tokenCount: 0,

  setMessages: (setterFnOrItems) => {
    stateOrSetter(set, 'messages', setterFnOrItems);
  },

  setElements: (elements) => {
    stateOrSetter(set, 'elements', elements);
  },

  setTaskList: (taskList) => {
    stateOrSetter(set, 'taskList', taskList);
  },

  setActions: (actions) => {
    stateOrSetter(set, 'actions', actions);
  },

  setChatInputs: (chatInputs) => {
    set({ chatInputs });
  },

  setTokenCount: (tokenCount) => {
    stateOrSetter(set, 'tokenCount', tokenCount);
  }
}));
