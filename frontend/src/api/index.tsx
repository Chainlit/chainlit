import { removeToken } from 'helpers/localStorageToken';
import toast from 'react-hot-toast';

const devServer = 'http://localhost:8000';
const url = import.meta.env.DEV ? devServer : window.origin;
const serverUrl = new URL(url);

const httpEndpoint = `${serverUrl.protocol}//${serverUrl.host}`;
export const wsEndpoint = httpEndpoint;

export class ClientError extends Error {
  detail?: string;

  constructor(message: string, detail?: string) {
    super(message);
    this.detail = detail;
  }

  toString() {
    if (this.detail) {
      return `${this.message}: ${this.detail}`;
    } else {
      return this.message;
    }
  }
}

const api = {
  fetch: async (
    method: string,
    endpoint: string,
    token?: string,
    data?: any,
    signal?: AbortSignal
  ) => {
    try {
      const headers: { Authorization?: string; 'Content-Type': string } = {
        'Content-Type': 'application/json'
      };
      if (token) headers['Authorization'] = token;

      const res = await fetch(httpEndpoint + endpoint, {
        method,
        headers,
        signal,
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401 && window.location.pathname !== '/login') {
          // The credentials aren't correct, remove the token and redirect to login
          removeToken();
          window.location.href = '/login';
        }
        throw new ClientError(res.statusText, body.detail);
      }

      return res;
    } catch (error: any) {
      if (error instanceof ClientError) {
        toast.error(error.toString());
      }
      console.error(error);
      throw error;
    }
  },

  get: async (endpoint: string, token?: string) =>
    await api.fetch('GET', endpoint, token),

  post: async (
    endpoint: string,
    data: any,
    token?: string,
    signal?: AbortSignal
  ) => await api.fetch('POST', endpoint, token, data, signal),

  put: async (endpoint: string, data: any, token?: string) =>
    await api.fetch('PUT', endpoint, token, data),

  patch: async (endpoint: string, data: any, token?: string) =>
    await api.fetch('PATCH', endpoint, token, data),

  delete: async (endpoint: string, data: any, token?: string) =>
    await api.fetch('DELETE', endpoint, token, data)
};

export { api, httpEndpoint };
