import jwt_decode from 'jwt-decode';
import { useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  accessTokenState,
  conversationsHistoryState,
  userState
} from 'src/state';
import { IAppUser } from 'src/types';
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
  const setConversationsHistory = useSetRecoilState(conversationsHistoryState);
  const [user, setUser] = useRecoilState(userState);

  const isReady = !!(!isLoading && data);

  const logout = () => {
    setUser(null);
    removeToken();
    setAccessToken('');
    setConversationsHistory(undefined);
  };

  const saveAndSetToken = (token: string | null | undefined) => {
    if (!token) {
      logout();
      return;
    }
    try {
      const { exp, ...AppUser } = jwt_decode(token) as any;
      setToken(token);
      setAccessToken(`Bearer ${token}`);
      setUser(AppUser as IAppUser);
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
      role: 'ANONYMOUS',
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
    role: user?.role,
    isAuthenticated,
    isReady,
    accessToken: accessToken,
    logout: logout,
    setAccessToken: saveAndSetToken
  };
};
