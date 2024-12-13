import useSWR, { SWRResponse } from 'swr';
import { useAuth } from '@chainlit/react-client';
import { boolean, string } from 'yup';

const getHeaders = (isAuthenticated: boolean, accessToken: string | undefined) => {
  if (isAuthenticated)
    return {
      Authorization: `Bearer ${accessToken}`,
    };

  return undefined;
}

const fetcher = async (url: string): Promise<any> => {
  const { isAuthenticated, accessToken } = useAuth();

  const headers = getHeaders(isAuthenticated, accessToken);
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error('Network response was not ok');
  }

  // Check if the response is JSON
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  } else {
    // If it's not JSON, return the raw response body
    return response.text();
  }
};

const useFetch = (endpoint: string | null): SWRResponse<any, Error> => {
  return useSWR<any, Error>(endpoint, fetcher);
};
export { useFetch };
