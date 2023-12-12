export type AuthProvider =
  | 'credentials'
  | 'header'
  | 'github'
  | 'google'
  | 'azure-ad';

export interface IUserMetadata extends Record<string, any> {
  tags?: string[];
  image?: string;
  provider?: AuthProvider;
}

export interface IUser {
  id: string;
  identifier: string;
  metadata: IUserMetadata;
}
