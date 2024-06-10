import jwt_decode from 'jwt-decode';
import { useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { accessTokenState, threadHistoryState, userState } from 'src/state';
import { IUser } from 'src/types';
import { getToken, removeToken, setToken } from 'src/utils/token';

import { ChainlitAPI } from '..';
import { useApi } from './api';

export const useAuth = (apiClient: ChainlitAPI) => {
  const { data, isLoading } = useApi<{
    requireLogin: boolean;
    passwordAuth: boolean;
    headerAuth: boolean;
    oauthProviders: string[];
  }>(apiClient, '/auth/config');
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);
  const [user, setUser] = useRecoilState(userState);

  const isReady = !!(!isLoading && data);

  const logout = async () => {
    await apiClient.logout(accessToken);
    setUser(null);
    removeToken();
    setAccessToken('');
    setThreadHistory(undefined);
  };

  const saveAndSetToken = (token: string | null | undefined) => {
    if (!token) {
      logout();
      return;
    }
    try {
      const { exp, ...User } = jwt_decode(token) as any;
      setToken(token);
      setAccessToken(`Bearer ${token}`);
      setUser(User as IUser);
    } catch (e) {
      console.error(
        'Invalid token, clearing token from local storage',
        'error:',
        e
      );
      logout();
    }
  };

  useEffect(() => {
    if (!user && getToken()) {
      // Initialize the token from local storage
      saveAndSetToken(getToken());
      return;
    }
  }, []);

  const isAuthenticated = !!accessToken;

  if (data && !data.requireLogin) {
    return {
      data,
      user: null,
      isReady,
      isAuthenticated: true,
      accessToken: '',
      logout: () => {},
      setAccessToken: () => {}
    };
  }

  return {
    data,
    user: user,
    isAuthenticated,
    isReady,
    accessToken: accessToken,
    logout: logout,
    setAccessToken: saveAndSetToken
  };
};
