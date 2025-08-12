import { useEffect } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import { useApi, useAuth } from './api';
import { configState, chatProfileState } from './state';
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

  // Always fetch when:
  // 1. We don't have config yet, OR
  // 2. Chat profile changed (config will be cleared in the effect below)
  const shouldFetch = !config && isAuthenticated;

  const { data, error, isLoading } = useApi<IChainlitConfig>(
    shouldFetch ? apiUrl : null
  );

  useEffect(() => {
    if (!data) return;
    setConfig(data);
  }, [data, setConfig]);

  // Clear config when chat profile changes to force re-fetch
  useEffect(() => {
    if (chatProfile !== undefined) {
      setConfig(undefined);
    }
  }, [chatProfile, setConfig]);

  return { config, error, isLoading, language };
};

export { useConfig };
