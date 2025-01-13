import { useContext, useMemo } from 'react';
import { ChainlitAPI } from 'src/api';
import { ChainlitContext } from 'src/context';
import useSWR, { SWRConfig, SWRConfiguration } from 'swr';

import { useAuthState } from './auth/state';

const fetcher = async (client: ChainlitAPI, endpoint: string) => {
  const res = await client.get(endpoint);
  return res?.json();
};

const cloneClient = (client: ChainlitAPI): ChainlitAPI => {
  // Shallow clone API client.
  // TODO: Move me to core API.

  // Create new client
  const newClient = new ChainlitAPI('', 'webapp');

  // Assign old properties to new client
  Object.assign(newClient, client);

  return newClient;
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
 * @param config - Optional SWR configuration
 * @returns SWR response object containing:
 *          - data: The fetched data
 *          - error: Any error that occurred
 *          - isValidating: Whether a request is in progress
 *          - mutate: Function to mutate the cached data
 *
 * @example
 * const { data, error, isValidating } = useApi<UserData>('/user');
 */
function useApi<T>(
  path?: string | null,
  { ...swrConfig }: SWRConfiguration = {}
) {
  const client = useContext(ChainlitContext);
  const { setUser } = useAuthState();

  // Memoize the fetcher function to avoid recreating it on every render
  const memoizedFetcher = useMemo(
    () =>
      ([url]: [url: string]) => {
        if (!swrConfig.onErrorRetry) {
          swrConfig.onErrorRetry = (...args) => {
            const [err] = args;

            // Don't do automatic retry for 401 - it just means we're not logged in (yet).
            if (err.status === 401) {
              setUser(null);
              return;
            }

            // Fall back to default behavior.
            return SWRConfig.defaultValue.onErrorRetry(...args);
          };
        }

        const useApiClient = cloneClient(client);
        useApiClient.on401 = useApiClient.onError = undefined;
        return fetcher(useApiClient, url);
      },
    [client]
  );

  // Use a stable key for useSWR
  const swrKey = useMemo(() => {
    return path ? [path] : null;
  }, [path]);

  return useSWR<T, Error>(swrKey, memoizedFetcher, swrConfig);
}

export { useApi, fetcher };
