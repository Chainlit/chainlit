import { atom } from 'recoil';

export const evoyaCreatorEnabledState = atom<boolean>({
  key: 'EvoyaCreatorEnabled',
  default: false
});