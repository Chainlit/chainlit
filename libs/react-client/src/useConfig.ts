import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { useApi, useAuth } from './api';
import { configState, userState } from './state';
import { IChainlitConfig } from './types';

const useConfig = (accessToken?: string) => {
  const [config, setConfig] = useRecoilState(configState);
  const user = useRecoilValue(userState);
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
    setConfig({
      ...data,
      ...{ui: {
        ...data.ui,
        cot: user?.config?.cot ?? 'hidden'
      }}
    });
    // setConfig(data);
  }, [data, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
