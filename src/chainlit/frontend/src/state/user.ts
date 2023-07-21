import { atom } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

export const sessionIdState = atom<string>({
  key: 'SessionId',
  default: uuidv4()
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
