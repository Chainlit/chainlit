import getRouterBasename from '@/lib/router';
import { toast } from 'sonner';

import { ChainlitAPI, ClientError } from '@chainlit/react-client';

const devServer = 'http://localhost:8000' + getRouterBasename();
const url = import.meta.env.DEV
  ? devServer
  : window.origin + getRouterBasename();
const serverUrl = new URL(url);

const httpEndpoint = serverUrl.toString();

const on401 = () => {
  if (window.location.pathname !== getRouterBasename() + '/login') {
    // The credentials aren't correct, remove the token and redirect to login
    window.location.href = getRouterBasename() + '/login';
  }
};

const onError = (error: ClientError) => {
  toast.error(error.toString());
};

export const apiClient = new ChainlitAPI(
  httpEndpoint,
  'webapp',
  {}, // Optional - additionalQueryParams property.
  on401,
  onError
);
