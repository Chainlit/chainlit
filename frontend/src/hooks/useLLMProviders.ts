import { apiClient } from 'api';
import { useEffect } from 'react';
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

  useEffect(() => {
    if (error) {
      toast.error(`Failed to fetch providers: ${error}`);
    }
    if (!data) return;
    setPlayground((old) => ({ ...old, providers: data.providers }));
  }, [data, error]);

  return null;
};

export { useLLMProviders };
