import { useEffect } from 'react';

import { useApi, useAuth } from './api';
import { useConfigStore } from './store/config';
import { IChainlitConfig } from './types';

const useConfig = () => {
  const { config, setConfig } = useConfigStore();
  const { isAuthenticated } = useAuth();
  const language = navigator.language || 'en-US';

  const { data, error, isLoading } = useApi<IChainlitConfig>(
    !config && isAuthenticated ? `/project/settings?language=${language}` : null
  );

  useEffect(() => {
    if (!data) return;
    setConfig(data);
  }, [data, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
