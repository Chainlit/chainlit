import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { authState } from 'src/state';
import { IAuthConfig } from 'src/types';

import { useApi } from '../api';

export const useAuthConfig = () => {
  const [authConfig, setAuthConfig] = useRecoilState(authState);
  const { data: authConfigData, isLoading } = useApi<IAuthConfig>(
    authConfig ? null : '/auth/config'
  );

  useEffect(() => {
    if (authConfigData) {
      setAuthConfig(authConfigData);
    }
  }, [authConfigData, setAuthConfig]);

  // Secure default: only set false if explicitly defined.
  const cookieAuth: boolean = authConfig?.cookieAuth !== false;

  return {
    authConfig,
    isLoading,
    setAuthConfig,
    cookieAuth
  };
};
