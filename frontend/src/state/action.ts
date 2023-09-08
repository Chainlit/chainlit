import { atom } from 'recoil';

import { IAction } from '@chainlit/components';

export const actionState = atom<IAction[]>({
  key: 'Actions',
  default: []
});
