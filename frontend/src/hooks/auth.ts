import { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import useSWRImmutable from 'swr/immutable';
import { useLocalStorage } from 'usehooks-ts';

import { accessTokenState } from 'state/user';

import { IUserDetails } from 'types/user';

import { fetcher } from './useApi';

export const useAuth = () => {
  const { data: config, isLoading: isLoadingConfig } = useSWRImmutable(
    '/auth/config',
    fetcher
  );
  const isReady = !isLoadingConfig && config;

  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const [_, setToken] = useLocalStorage('token', accessToken);
  const [user, setUser] = useState<IUserDetails | null>(null);

  useEffect(() => {
    setToken(accessToken);
    if (!accessToken) {
      return;
    }
    try {
      const { exp, ...userDetails } = JSON.parse(
        atob(accessToken.split('.')[1])
      );
      setUser(userDetails as IUserDetails);
    } catch (e) {
      console.error('Invalid token, clearing token from local storage');
      setUser(null);
      setAccessToken('');
    }
  }, [accessToken, setAccessToken, setToken]);

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
    logout: () => {
      setUser(null);
      setAccessToken('');
    },
    setAccessToken: (accessToken: string) =>
      setAccessToken(`Bearer ${accessToken}`)
  };
};
