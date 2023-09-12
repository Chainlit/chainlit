import { getToken, removeToken, setToken } from 'helpers/localStorageToken';
import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import useSWRImmutable from 'swr/immutable';

import { accessTokenState } from 'state/user';

import { IAppUser } from 'types/user';

import { fetcher } from './useApi';

export const useAuth = () => {
  const { data: config, isLoading: isLoadingConfig } = useSWRImmutable<{
    requireLogin: boolean;
    passwordAuth: boolean;
    headerAuth: boolean;
    oauthProviders: string[];
  }>('/auth/config', fetcher);
  const isReady = !!(!isLoadingConfig && config);
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const [user, setUser] = useState<IAppUser | null>(null);

  const logout = () => {
    removeToken();
    setAccessToken('');
    setUser(null);
  };

  const saveAndSetToken = (token: string | null | undefined) => {
    if (!token) {
      logout();
      return;
    }
    try {
      const { exp, ...AppUser } = JSON.parse(atob(token.split('.')[1]));
      setToken(token);
      setAccessToken(`Bearer ${token}`);
      setUser(AppUser as IAppUser);
    } catch (e) {
      console.error('Invalid token, clearing token from local storage');
      logout();
    }
  };

  useEffect(() => {
    if (!user && getToken()) {
      // Initialize the token from local storage
      saveAndSetToken(getToken());
      return;
    }
  }, [accessToken]);

  const isAuthenticated = !!accessToken;

  if (config && !config.requireLogin) {
    return {
      config,
      user: null,
      role: 'ANONYMOUS',
      isReady,
      isAuthenticated: true,
      accessToken: '',
      logout: () => {},
      setAccessToken: () => {}
    };
  }

  return {
    config,
    user: user,
    role: user?.role,
    isAuthenticated,
    isReady,
    accessToken: accessToken,
    logout: logout,
    setAccessToken: saveAndSetToken
  };
};
