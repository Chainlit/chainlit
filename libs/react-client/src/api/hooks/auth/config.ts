import { useEffect } from 'react';
import { IAuthConfig } from 'src/index';

import { useApi } from '../api';
import { useAuthState } from './state';

export const useAuthConfig = () => {
  const token = localStorage.getItem('chainlit_token') || '';
  const { authConfig, setAuthConfig } = useAuthState();
  const headers: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};
  const { data: authConfigData, isLoading } = useApi<IAuthConfig>(
    authConfig ? null : '/auth/config',
    { headers }
  );

  useEffect(() => {
    if (authConfigData) {
      setAuthConfig(authConfigData);
    }
  }, [authConfigData, setAuthConfig]);

  return { authConfig, isLoading };
};
