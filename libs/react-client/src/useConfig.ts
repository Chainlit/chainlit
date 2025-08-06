import { useEffect } from 'react';
import { useRecoilState } from 'recoil';

import { useApi, useAuth } from './api';
import { configState, languageState } from './state';
import { IChainlitConfig } from './types';

const useConfig = () => {
  const [config, setConfig] = useRecoilState(configState);
  const [language, setLanguage] = useRecoilState(languageState);
  const { isAuthenticated } = useAuth();

  const { data, error, isLoading } = useApi<IChainlitConfig>(
    !config && isAuthenticated ? `/project/settings?language=${language}` : null
  );

  useEffect(() => {
    if (!data) return;
    console.log('Config loaded for language:', language);
    setConfig(data);
  }, [data, setConfig]);

  useEffect(() => {
    if (error) {
      console.error('Error loading config for language:', language, error);
    }
  }, [error, language]);

  return { config, error, isLoading, language, setLanguage };
};

export { useConfig };
