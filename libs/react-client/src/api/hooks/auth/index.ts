import { IAuthConfig, IUser } from 'src/types';

import { useAuthConfig } from './config';
import { useSessionManagement } from './sessionManagement';
import { useUserManagement } from './userManagement';

export const useAuth = () => {
  const { authConfig } = useAuthConfig();
  const { logout } = useSessionManagement();
  const { user, setUserFromAPI } = useUserManagement();

  const isReady =
    !!authConfig && (!authConfig.requireLogin || user !== undefined);

  if (authConfig && !authConfig.requireLogin) {
    return {
      data: authConfig,
      user: null,
      isReady,
      isAuthenticated: true,
      logout: () => Promise.resolve(),
      setUserFromAPI: () => Promise.resolve()
    };
  }

  return {
    data: authConfig,
    user,
    isReady,
    isAuthenticated: !!user,
    logout,
    setUserFromAPI
  };
};

export type { IAuthConfig, IUser };
