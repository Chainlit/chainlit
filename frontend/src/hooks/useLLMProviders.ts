import { useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { toast } from 'sonner';

import { useApi } from '@chainlit/react-client';

import { useTranslation } from 'components/i18n/Translator';

import { apiClientState } from 'state/apiClient';
import { playgroundState } from 'state/playground';

import { IPlayground } from 'types/playground';

const useLLMProviders = (shouldFetch?: boolean) => {
  const apiClient = useRecoilValue(apiClientState);

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
