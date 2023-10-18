import { api } from 'api';
import useSWR, { SWRConfiguration } from 'swr';

import { useAuth } from './auth';

const fetcher = async (endpoint: string, token?: string) => {
  const res = await api.get(endpoint, token);

  return res?.json();
};

function useApi<T>(endpoint: string | null, options?: SWRConfiguration) {
  const { accessToken } = useAuth();

  return useSWR<T>(
    endpoint ? [endpoint, accessToken] : null,
    ([url, token]: [url: string, token: string]) => fetcher(url, token),
    options
  );
}

export { useApi, fetcher };
