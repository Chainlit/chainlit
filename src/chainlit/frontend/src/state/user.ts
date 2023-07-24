import { DefaultValue, atom, selector } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

export const accessTokenState = atom<string | undefined>({
  key: 'AccessToken',
  default: undefined
});

const sessionIdAtom = atom<string>({
  key: 'SessionId',
  default: uuidv4()
});

export const sessionIdState = selector({
  key: 'SessionIdSelector',
  get: ({ get }) => get(sessionIdAtom),
  set: ({ set }, newValue) =>
    set(sessionIdAtom, newValue instanceof DefaultValue ? uuidv4() : newValue)
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
