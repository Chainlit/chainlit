const devServer = 'http://127.0.0.1:8000';
const url = import.meta.env.DEV ? devServer : window.origin;
const serverUrl = new URL(url);

const httpEndpoint = `${serverUrl.protocol}//${serverUrl.host}`;
export const wsEndpoint = httpEndpoint;

const api = {
  fetch: async (
    method: string,
    endpoint: string,
    token?: string,
    data?: any
  ) => {
    try {
      const headers: { Authorization?: string; 'Content-Type': string } = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(httpEndpoint + endpoint, {
        method,
        headers,
        body: JSON.stringify(data)
      });
      return res;
    } catch (error) {
      throw new Error(error.statusText);
    }
  },

  get: async (endpoint: string, token: string) =>
    await api.fetch('GET', endpoint, token),

  post: async (endpoint: string, data: any, token: string) =>
    await api.fetch('POST', endpoint, token, data),

  put: async (endpoint: string, data: any, token: string) =>
    await api.fetch('PUT', endpoint, token, data),

  patch: async (endpoint: string, data: any, token?: string) =>
    await api.fetch('PATCH', endpoint, token, data),

  delete: async (endpoint: string, token: string) =>
    await api.fetch('DELETE', endpoint, token)
};

export { api };
