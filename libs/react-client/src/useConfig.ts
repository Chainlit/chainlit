import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { useApi, useAuth } from './api';
import { chatProfileState, configState } from './state';
import { IChainlitConfig } from './types';

const useConfig = () => {
  const [config, setConfig] = useRecoilState(configState);
  const { isAuthenticated } = useAuth();
  const chatProfile = useRecoilValue(chatProfileState);
  const language = navigator.language || 'en-US';

  // Build the API URL with optional chat profile parameter
  const apiUrl = isAuthenticated
    ? `/project/settings?language=${language}${chatProfile ? `&chat_profile=${encodeURIComponent(chatProfile)}` : ''}`
    : null;

  const { data, error, isLoading } = useApi<IChainlitConfig>(apiUrl);

  useEffect(() => {
    if (!data) return;
    setConfig(data);
  }, [data, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
