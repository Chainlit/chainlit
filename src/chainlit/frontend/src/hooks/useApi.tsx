import { api } from 'api';
import { useRecoilValue } from 'recoil';
import useSWR from 'swr';

import { accessTokenState } from 'state/user';

const fetcher = async (endpoint: string, token: string) => {
  const res = await api.get(endpoint, token);

  return res?.json();
};

function useApi<T>(endpoint: string | null) {
  const accessToken = useRecoilValue(accessTokenState);

  return useSWR<T>(
    endpoint ? [endpoint, accessToken] : null,
    ([url, token]: [url: string, token: string]) => fetcher(url, token)
  );
}

export { useApi };
