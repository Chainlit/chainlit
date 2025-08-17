import getRouterBasename from '@/lib/router';
import { toast } from 'sonner';

import { ChainlitAPI, ClientError } from '@chainlit/react-client';

const devServer = 'http://localhost:8003' + getRouterBasename();
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

class ExtendedChainlitAPI extends ChainlitAPI {
  connectStreamableHttpMCP(sessionId: string, name: string, url: string) {
    // Assumes the backend expects { clientType, name, url }
    return fetch(`${this.httpEndpoint}mcp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionId ? { 'x-session-id': sessionId } : {})
      },
      body: JSON.stringify({
        clientType: 'streamable-http',
        name,
        url,
        sessionId
      })
    }).then(async (res) => {
      const data = await res.json();
      return { success: res.ok, mcp: data.mcp, error: data.detail };
    });
  }
}

export const apiClient = new ExtendedChainlitAPI(
  httpEndpoint,
  'webapp',
  {}, // Optional - additionalQueryParams property.
  on401,
  onError
);
