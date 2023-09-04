export type Role = 'USER' | 'ADMIN' | 'OWNER' | 'ANONYMOUS' | undefined;

export interface IMember {
  name: string;
  email: string;
  role: Role;
}
