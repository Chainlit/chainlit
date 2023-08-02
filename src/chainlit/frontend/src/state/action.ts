import { atom } from 'recoil';

export interface IAction {
  name: string;
  value: string;
  forId: string;
  label?: string;
  description?: string;
}

export const actionState = atom<IAction[]>({
  key: 'Actions',
  default: []
});
