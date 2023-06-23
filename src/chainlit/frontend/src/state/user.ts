import { atom } from 'recoil';

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS' | undefined;

export interface IMember {
  name: string;
  email: string;
  role: Role;
}

export const roleState = atom<Role>({
  key: 'Role',
  default: undefined
});

const localUserEnv = localStorage.getItem('userEnv');

export const userEnvState = atom<Record<string, string>>({
  key: 'UserEnv',
  default: localUserEnv ? JSON.parse(localUserEnv) : {}
});
