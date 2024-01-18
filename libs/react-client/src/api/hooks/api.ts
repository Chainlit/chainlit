import { useRecoilValue } from 'recoil';
import { ChainlitAPI } from 'src/api';
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
  client: ChainlitAPI,
  path?: string | null,
  options?: SWRConfiguration
) {
  const accessToken = useRecoilValue(accessTokenState);

  return useSWR<T, Error>(
    path ? [path, accessToken] : null,
    ([url, token]: [url: string, token: string]) => fetcher(client, url, token),
    options
  );
}

export { useApi, fetcher };
