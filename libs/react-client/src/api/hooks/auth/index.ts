import { useRecoilState } from 'recoil';
import { useAuthConfig } from 'src/auth/config';
import { useSessionManagement } from 'src/auth/session';
import { useTokenManagement } from 'src/auth/token';
import { IUseAuth } from 'src/auth/types';
import { useUser } from 'src/auth/user';
import { accessTokenState } from 'src/state';

export const useAuth = (): IUseAuth => {
  console.log('useAuth');
  const { authConfig, isLoading, cookieAuth } = useAuthConfig();
  const { logout } = useSessionManagement();
  const { user, setUserFromAPI } = useUser();
  const [accessToken] = useRecoilState(accessTokenState);

  const { handleSetAccessToken } = useTokenManagement();

  const isReady = !!(!isLoading && authConfig);

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

// Re-export types and main hook
export type { IUseAuth };
