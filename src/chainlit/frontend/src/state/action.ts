import { atom } from 'recoil';

export interface IAction {
  name: string;
  trigger: string;
  description?: string;
}

export type IActions = Record<string, IAction>;

export const actionState = atom<IActions>({
  key: 'Actions',
  default: {}
});
