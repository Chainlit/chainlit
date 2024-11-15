import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { useApi, useAuth } from './api';
import { configState } from './state';
import { IChainlitConfig } from './types';

const useConfig = (accessToken?: string) => {
  console.log('useConfig');

  const [config, setConfig] = useRecoilState(configState);
  const { isAuthenticated } = useAuth();
  const language = navigator.language || 'en-US';

  const { data, error, isLoading } = useApi<IChainlitConfig>(
    !config && isAuthenticated
      ? `/project/settings?language=${language}`
      : null,
    { token: accessToken }
  );

  useEffect(() => {
    if (!data) return;
    console.log('setConfig');
    setConfig(data);
  }, [data, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
