import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { useApi, useAuth } from './api';
import { configState, userState } from './state';
import { IChainlitConfig } from './types';

const useConfig = () => {
  const [config, setConfig] = useRecoilState(configState);
  const { isAuthenticated } = useAuth();
  const user = useRecoilValue(userState);
  const language = navigator.language || 'en-US';

  const { data, error, isLoading } = useApi<IChainlitConfig>(
    !config && isAuthenticated ? `/project/settings?language=${language}` : null
  );
  
  useEffect(() => {
    if (!data) return;
    setConfig({
      ...data,
      ...{
        ui: {
          ...data.ui,
          cot: user?.metadata?.role === 'ANONYMOUS' ? 'hidden' : 'tool_call'
        }
      }
    });
  }, [data, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
