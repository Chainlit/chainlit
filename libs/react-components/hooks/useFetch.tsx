import useSWR, { SWRResponse } from 'swr';

const fetcher = async (url: string): Promise<any> => {
  const response = await fetch(url);

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
