import { api } from 'api';
import useSWR from 'swr';

import { useAuth } from './auth';

const fetcher = async (endpoint: string, token?: string) => {
  const res = await api.get(endpoint, token);

  return res?.json();
};

function useApi<T>(endpoint: string | null, preventDefault?: boolean) {
  const { accessToken } = useAuth();

  const options = preventDefault
    ? {
        revalidateIfStale: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false
      }
    : undefined;

  return useSWR<T>(
    endpoint ? [endpoint, accessToken] : null,
    ([url, token]: [url: string, token: string]) => fetcher(url, token),
    options
  );
}

export { useApi, fetcher };
