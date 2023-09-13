export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS';

export type AppUserProvider =
  | 'credentials'
  | 'header'
  | 'github'
  | 'google'
  | 'azure-ad';

export interface IAppUser {
  id: string;
  username: string;
  role: Role;
  tags?: string[];
  image?: string;
  provider?: AppUserProvider;
}
