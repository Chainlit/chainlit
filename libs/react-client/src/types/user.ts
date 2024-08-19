export type AuthProvider =
  | 'credentials'
  | 'header'
  | 'github'
  | 'google'
  | 'azure-ad'
  | 'azure-ad-hybrid';

export interface IUserMetadata extends Record<string, any> {
  tags?: string[];
  image?: string;
  provider?: AuthProvider;
}

export interface IUser {
  id: string;
  identifier: string;
  display_name?: string;
  metadata: IUserMetadata;
}
