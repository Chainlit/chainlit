import { useContext } from 'react';
import useSWR, { SWRResponse } from 'swr';

import { ChainlitContext } from '@chainlit/react-client';

const fetcher =
  (isChainlitRequest: boolean) =>
  async (url: string): Promise<any> => {
    const fetchOptions: RequestInit = {
      ...(isChainlitRequest && { credentials: 'include' })
    };

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const contentType = response.headers.get('content-type');
    return contentType?.includes('application/json')
      ? response.json()
      : response.text();
  };

const useFetch = (endpoint: string | null): SWRResponse<any, Error> => {
  const apiClient = useContext(ChainlitContext);
  const isChainlitRequest = endpoint?.startsWith(apiClient.httpEndpoint);

  return useSWR<any, Error>(endpoint, fetcher(!!isChainlitRequest));
};

export { useFetch };
