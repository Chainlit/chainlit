export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS';

export interface IMember {
  name: string;
  email: string;
  role: Role;
}

export type AppUserProvider = 'credentials' | 'header';

export interface IAppUser {
  id: string;
  username: string;
  role: Role;
  tags?: string[];
  image?: string;
  provider?: AppUserProvider;
}
