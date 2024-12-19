import { IAuthConfig, IUser } from 'src/types';

import { useAuthConfig } from './config';
import { useSessionManagement } from './sessionManagement';
import { useAuthState } from './state';
import { useTokenManagement } from './tokenManagement';
import { useUserManagement } from './userManagement';

export const useAuth = () => {
  const { authConfig, cookieAuth } = useAuthConfig();
  const { logout } = useSessionManagement();
  const { user, setUserFromAPI } = useUserManagement();
  const { accessToken } = useAuthState();
  const { handleSetAccessToken } = useTokenManagement();

  const isReady = !!authConfig;

  if (authConfig && !authConfig.requireLogin) {
    return {
      data: authConfig,
      user: null,
      isReady,
      isAuthenticated: true,
      accessToken: '',
      logout: () => Promise.resolve(),
      setAccessToken: () => {},
      setUserFromAPI: () => Promise.resolve(),
      cookieAuth
    };
  }

  return {
    data: authConfig,
    user,
    isReady,
    isAuthenticated: !!user,
    accessToken,
    logout,
    setAccessToken: handleSetAccessToken,
    setUserFromAPI,
    cookieAuth
  };
};

export type { IAuthConfig, IUser };
