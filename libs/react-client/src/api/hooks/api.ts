import { useContext, useMemo } from 'react';
import { useRecoilValue } from 'recoil';
import { ChainlitAPI } from 'src/api';
import { ChainlitContext } from 'src/context';
import { accessTokenState } from 'src/state';
import useSWR, { SWRConfiguration } from 'swr';

const fetcher = async (
  client: ChainlitAPI,
  endpoint: string,
  token?: string
) => {
  const res = await client.get(endpoint, token);
  return res?.json();
};

function useApi<T>(
  path?: string | null,
  { token, ...swrConfig }: SWRConfiguration & { token?: string } = {}
) {
  const client = useContext(ChainlitContext);
  let accessToken = useRecoilValue(accessTokenState);
  accessToken = token || accessToken;

  // Memoize the fetcher function to avoid recreating it on every render
  const memoizedFetcher = useMemo(
    () =>
      ([url, token]: [url: string, token: string]) =>
        fetcher(client, url, token),
    [client]
  );

  // Use a stable key for useSWR
  const swrKey = useMemo(() => {
    return path ? [path, accessToken] : null;
  }, [path, accessToken]);

  return useSWR<T, Error>(swrKey, memoizedFetcher, swrConfig);
}

export { useApi, fetcher };
