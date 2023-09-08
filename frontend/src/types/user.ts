export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS';

export interface IMember {
  name: string;
  email: string;
  role: Role;
}

export type UserDetailsProvider = 'credentials' | 'header';

export interface IUserDetails {
  id: string;
  username: string;
  role: Role;
  tags?: string[];
  image?: string;
  provider?: UserDetailsProvider;
}
