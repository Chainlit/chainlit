import { useEffect } from 'react';
import { IUser } from 'src/types';

import { useApi } from '../api';
import { useAuthState } from './state';

export const useUserManagement = () => {
  const { user, setUser } = useAuthState();

  const {
    data: userData,
    error,
    isLoading,
    mutate: setUserFromAPI
  } = useApi<IUser>('/user');

  useEffect(() => {
    if (userData) {
      setUser(userData);
    } else if (isLoading) {
      setUser(undefined);
    }
  }, [userData, isLoading, setUser]);

  useEffect(() => {
    if (error) {
      setUser(null);
    }
  }, [error]);

  return { user, setUserFromAPI };
};
