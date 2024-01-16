import { apiClient } from 'api';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import { useApi } from '@chainlit/react-client';
import { IPlayground } from '@chainlit/react-components';

import { playgroundState } from 'state/playground';

const useLLMProviders = (shouldFetch?: boolean) => {
  const { data, error } = useApi<IPlayground>(
    apiClient,
    shouldFetch ? '/project/llm-providers' : null
  );
  const setPlayground = useSetRecoilState(playgroundState);

  const { t } = useTranslation();

  useEffect(() => {
    if (error) {
      toast.error(
        `${t('hooks.useLLMProviders.failedToFetchProviders')} ${error}`
      );
    }
    if (!data) return;
    setPlayground((old) => ({ ...old, providers: data.providers }));
  }, [data, error]);

  return null;
};

export { useLLMProviders };
