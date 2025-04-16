import { atom } from 'recoil';

import type { IStep } from 'client-types/';

export const creatorActiveState = atom<boolean>({
  key: 'CreatorActive',
  default: false
});

export const creatorContentState = atom<string>({
  key: 'CreatorContent',
  default: ''
});

export const creatorTypeState = atom<string>({
  key: 'CreatorType',
  default: ''
});

export const creatorMessageState = atom<IStep | null>({
  key: 'CreatorMessage',
  default: null
});
