import { atom } from 'recoil';

export interface IAction {
  id: string;
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
