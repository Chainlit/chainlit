import { IAuthConfig, IUser } from 'src/types';

import { useAuthConfig } from './config';
import { useSessionManagement } from './sessionManagement';
import { useUserManagement } from './userManagement';

export const useAuth = () => {
  const { authConfig } = useAuthConfig();
  const { logout } = useSessionManagement();
  const { user, setUserFromAPI,setUser } = useUserManagement();

  const isReady =
    !!authConfig && (!authConfig.requireLogin || user !== undefined);

  if (authConfig && !authConfig.requireLogin) {
    return {
      data: authConfig,
      user: null,
      isReady,
      isAuthenticated: true,
      logout: () => Promise.resolve(),
      setUserFromAPI: () => Promise.resolve(),
      setUser
    };
  }

  return {
    data: authConfig,
    user,
    isReady,
    isAuthenticated: !!user,
    logout,
    setUserFromAPI,
    setUser
  };
};

export type { IAuthConfig, IUser };
