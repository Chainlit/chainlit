import { IAuthConfig, IUser } from 'src/types';

export interface JWTPayload extends IUser {
  exp: number;
}

export interface AuthState {
  data: IAuthConfig | undefined;
  user: IUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
}

export interface AuthActions {
  logout: (reload?: boolean) => Promise<void>;
  setUserFromAPI: () => Promise<void>;
}

export type IUseAuth = AuthState & AuthActions;
