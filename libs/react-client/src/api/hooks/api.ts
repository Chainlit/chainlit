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

/**
 * React hook for cached API data fetching using SWR (stale-while-revalidate).
 * Optimized for GET requests with automatic caching and revalidation.
 *
 * Key features:
 * - Automatic data caching and revalidation
 * - Integration with React component lifecycle
 * - Loading state management
 * - Recoil state integration for global state
 * - Memoized fetcher function to prevent unnecessary rerenders
 *
 * @param path - API endpoint path or null to disable the request
 * @param config - Optional SWR configuration and token override
 * @returns SWR response object containing:
 *          - data: The fetched data
 *          - error: Any error that occurred
 *          - isValidating: Whether a request is in progress
 *          - mutate: Function to mutate the cached data
 *
 * @example
 * const { data, error, isValidating } = useApi<UserData>('/user', {
 *   token: accessToken
 * });
 */
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
