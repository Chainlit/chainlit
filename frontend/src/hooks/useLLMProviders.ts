import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useSetRecoilState } from 'recoil';

import { IPlayground } from '@chainlit/components';

import { useApi } from 'hooks/useApi';

import { playgroundState } from 'state/playground';

const useLLMProviders = (shouldFetch?: boolean) => {
  const { data, error } = useApi<IPlayground>(
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
