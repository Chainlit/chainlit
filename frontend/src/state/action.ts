import { atom } from 'recoil';

import { IAction } from 'types/action';

export const actionState = atom<IAction[]>({
  key: 'Actions',
  default: []
});
