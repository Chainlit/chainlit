import { IThread } from 'src/types';
import { removeToken } from 'src/utils/token';

import { IFeedback } from 'src/types/feedback';

export * from './hooks/auth';
export * from './hooks/api';

export interface IThreadFilters {
  search?: string;
  feedback?: number;
}

export interface IPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface IPagination {
  first: number;
  cursor?: string | number;
}

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

type Payload = FormData | any;

export class APIBase {
  constructor(
    public httpEndpoint: string,
    public type: 'webapp' | 'copilot' | 'teams' | 'slack' | 'discord',
    public on401?: () => void,
    public onError?: (error: ClientError) => void
  ) {}

  buildEndpoint(path: string) {
    if (this.httpEndpoint.endsWith('/')) {
      // remove trailing slash on httpEndpoint
      return `${this.httpEndpoint.slice(0, -1)}${path}`;
    } else {
      return `${this.httpEndpoint}${path}`;
    }
  }

  checkToken(token: string) {
    const prefix = 'Bearer ';
    if (token.startsWith(prefix)) {
      return token;
    } else {
      return prefix + token;
    }
  }

  async fetch(
    method: string,
    path: string,
    token?: string,
    data?: Payload,
    signal?: AbortSignal
  ): Promise<Response> {
    try {
      const headers: { Authorization?: string; 'Content-Type'?: string } = {};
      if (token) headers['Authorization'] = this.checkToken(token); // Assuming token is a bearer token

      let body;

      if (data instanceof FormData) {
        body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        body = data ? JSON.stringify(data) : null;
      }

      const res = await fetch(this.buildEndpoint(path), {
        method,
        headers,
        signal,
        body
      });

      if (!res.ok) {
        const body = await res.json();
        if (res.status === 401 && this.on401) {
          removeToken();
          this.on401();
        }
        throw new ClientError(res.statusText, body.detail);
      }

      return res;
    } catch (error: any) {
      if (error instanceof ClientError && this.onError) {
        this.onError(error);
      }
      console.error(error);
      throw error;
    }
  }

  async get(endpoint: string, token?: string) {
    return await this.fetch('GET', endpoint, token);
  }

  async post(
    endpoint: string,
    data: Payload,
    token?: string,
    signal?: AbortSignal
  ) {
    return await this.fetch('POST', endpoint, token, data, signal);
  }

  async put(endpoint: string, data: Payload, token?: string) {
    return await this.fetch('PUT', endpoint, token, data);
  }

  async patch(endpoint: string, data: Payload, token?: string) {
    return await this.fetch('PATCH', endpoint, token, data);
  }

  async delete(endpoint: string, data: Payload, token?: string) {
    return await this.fetch('DELETE', endpoint, token, data);
  }
}

export class ChainlitAPI extends APIBase {
  async headerAuth() {
    const res = await this.post(`/auth/header`, {});
    return res.json();
  }

  async passwordAuth(data: FormData) {
    const res = await this.post(`/login`, data);
    return res.json();
  }

  async logout(accessToken?: string) {
    const res = await this.post(`/logout`, {}, accessToken);
    return res.json();
  }

  async setFeedback(
    feedback: IFeedback,
    accessToken?: string
  ): Promise<{ success: boolean; feedbackId: string }> {
    const res = await this.put(`/feedback`, { feedback }, accessToken);
    return res.json();
  }

  async deleteFeedback(
    feedbackId: string,
    accessToken?: string
  ): Promise<{ success: boolean }> {
    const res = await this.delete(`/feedback`, { feedbackId }, accessToken);
    return res.json();
  }

  async listThreads(
    pagination: IPagination,
    filter: IThreadFilters,
    accessToken?: string
  ): Promise<{
    pageInfo: IPageInfo;
    data: IThread[];
  }> {
    const res = await this.post(
      `/project/threads`,
      { pagination, filter },
      accessToken
    );

    return res.json();
  }

  async deleteThread(threadId: string, accessToken?: string) {
    const res = await this.delete(`/project/thread`, { threadId }, accessToken);

    return res.json();
  }

  uploadFile(
    file: File,
    onProgress: (progress: number) => void,
    sessionId: string,
    token?: string
  ) {
    const xhr = new XMLHttpRequest();

    const promise = new Promise<{ id: string }>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      xhr.open(
        'POST',
        this.buildEndpoint(`/project/file?session_id=${sessionId}`),
        true
      );

      if (token) {
        xhr.setRequestHeader('Authorization', this.checkToken(token));
      }

      // Track the progress of the upload
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percentage = (event.loaded / event.total) * 100;
          onProgress(percentage);
        }
      };

      xhr.onload = function () {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } else {
          reject('Upload failed');
        }
      };

      xhr.onerror = function () {
        reject('Upload error');
      };

      xhr.send(formData);
    });

    return { xhr, promise };
  }

  getElementUrl(id: string, sessionId: string) {
    const queryParams = `?session_id=${sessionId}`;
    return this.buildEndpoint(`/project/file/${id}${queryParams}`);
  }

  getLogoEndpoint(theme: string) {
    return this.buildEndpoint(`/logo?theme=${theme}`);
  }

  getOAuthEndpoint(provider: string) {
    return this.buildEndpoint(`/auth/oauth/${provider}`);
  }
}
