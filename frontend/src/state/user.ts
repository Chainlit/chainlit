import { atom } from 'recoil';

import { IAppUser, Role } from 'types/user';

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

export const roleState = atom<Role>({
  key: 'Role',
  default: undefined
});

const localUserEnv = localStorage.getItem('userEnv');

export const userEnvState = atom<Record<string, string>>({
  key: 'UserEnv',
  default: localUserEnv ? JSON.parse(localUserEnv) : {}
});

export const userState = atom<IAppUser | null>({
  key: 'User',
  default: null
});
