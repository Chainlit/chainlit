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

  console.log("1111", user)
  const { data: userData, isLoading, mutate: setUserFromAPI } = useApi<IUser>(
    cookieAuth ? '/user' : null
  );

  console.log("2222", userData)

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if(!isLoading) {
      setUser(null)
    }
  }, [userData, isLoading, setUser]);

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
