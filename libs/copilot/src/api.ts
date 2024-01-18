import { toast } from 'sonner';

import { ChainlitAPI, ClientError } from '@chainlit/react-client';

export function makeApiClient(chainlitServer: string) {
  const serverUrl = new URL(chainlitServer);

  const httpEndpoint = `${serverUrl.protocol}//${serverUrl.host}`;

  const on401 = () => {
    toast.error('Unauthorized');
  };

  const onError = (error: ClientError) => {
    toast.error(error.toString());
  };

  return new ChainlitAPI(httpEndpoint, 'copilot', on401, onError);
}
