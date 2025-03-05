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
  } = useApi<IUser>('/user', {
    fetcher: (url: string) => fetch(url, {
      credentials: 'include', // This is the key change
      headers: {
        'Content-Type': 'application/json',
      }
    }).then(res => {
      if (!res.ok) throw new Error('API error');
      return res.json();
    })
  });

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

  return { user, setUserFromAPI, setUser };
};
