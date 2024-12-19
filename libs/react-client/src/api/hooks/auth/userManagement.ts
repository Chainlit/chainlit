import { useEffect } from 'react';
import { IUser } from 'src/types';

import { useApi } from '../api';
import { useAuthConfig } from './config';
import { useAuthState } from './state';
import { useTokenManagement } from './tokenManagement';

export const useUserManagement = () => {
  const { user, setUser, cookieAuth } = useAuthState();
  const { handleSetAccessToken } = useTokenManagement();
  const { isLoading: authConfigLoading } = useAuthConfig();

  const { data: userData, mutate: setUserFromAPI } = useApi<IUser>(
    cookieAuth ? '/user' : null
  );

  useEffect(() => {
    if (userData) {
      setUser(userData);
    }
  }, [userData, setUser]);

  useEffect(() => {
    if (!(user && authConfigLoading && cookieAuth)) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        handleSetAccessToken(token);
      }
    }
  }, [user, cookieAuth, authConfigLoading]);

  return { user, setUserFromAPI };
};
