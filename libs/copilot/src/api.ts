import { toast } from 'sonner';

import { ChainlitAPI, ClientError } from '@chainlit/react-client';

export function makeApiClient(
  chainlitServer: string,
  additionalQueryParams: Record<string, string>
) {
  const httpEndpoint = chainlitServer;

  const on401 = () => {
    toast.error('Unauthorized');
  };

  const onError = (error: ClientError) => {
    toast.error(error.toString());
  };

  return new ChainlitAPI(
    httpEndpoint,
    'copilot',
    additionalQueryParams,
    on401,
    onError
  );
}
