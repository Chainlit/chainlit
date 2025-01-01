import { IElement, IThread, IUser } from 'src/types';

import { IAction } from 'src/types/action';
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
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.status = status;
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

  private async getDetailFromErrorResponse(
    res: Response
  ): Promise<string | undefined> {
    try {
      const body = await res.json();
      return body?.detail;
    } catch (error: any) {
      console.error('Unable to parse error response', error);
    }
    return undefined;
  }

  private handleRequestError(error: any) {
    if (error instanceof ClientError) {
      if (error.status === 401 && this.on401) {
        this.on401();
      }
      if (this.onError) {
        this.onError(error);
      }
    }
    console.error(error);
  }

  /**
   * Low-level HTTP request handler for direct API interactions.
   * Provides full control over HTTP methods, request configuration, and error handling.
   *
   * Key features:
   * - Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
   * - Handles both FormData and JSON payloads
   * - Manages authentication headers
   * - Custom error handling with ClientError class
   * - Support for request cancellation via AbortSignal
   *
   * @param method - HTTP method to use (GET, POST, etc.)
   * @param path - API endpoint path
   * @param data - Optional request payload (FormData or JSON-serializable data)
   * @param signal - Optional AbortSignal for request cancellation
   * @returns Promise<Response>
   * @throws ClientError for HTTP errors, including 401 unauthorized
   */
  async fetch(
    method: string,
    path: string,
    data?: Payload,
    signal?: AbortSignal,
    headers: { Authorization?: string; 'Content-Type'?: string } = {}
  ): Promise<Response> {
    try {
      let body;

      if (data instanceof FormData) {
        body = data;
      } else {
        headers['Content-Type'] = 'application/json';
        body = data ? JSON.stringify(data) : null;
      }

      const res = await fetch(this.buildEndpoint(path), {
        method,
        credentials: 'include',
        headers,
        signal,
        body
      });

      if (!res.ok) {
        const detail = await this.getDetailFromErrorResponse(res);

        throw new ClientError(res.statusText, res.status, detail);
      }

      return res;
    } catch (error: any) {
      this.handleRequestError(error);
      throw error;
    }
  }

  async get(endpoint: string) {
    return await this.fetch('GET', endpoint);
  }

  async post(endpoint: string, data: Payload, signal?: AbortSignal) {
    return await this.fetch('POST', endpoint, data, signal);
  }

  async put(endpoint: string, data: Payload) {
    return await this.fetch('PUT', endpoint, data);
  }

  async patch(endpoint: string, data: Payload) {
    return await this.fetch('PATCH', endpoint, data);
  }

  async delete(endpoint: string, data: Payload) {
    return await this.fetch('DELETE', endpoint, data);
  }
}

export class ChainlitAPI extends APIBase {
  async headerAuth() {
    const res = await this.post(`/auth/header`, {});
    return res.json();
  }

  async jwtAuth(token: string) {
    const res = await this.fetch('POST', '/auth/jwt', undefined, undefined, {
      Authorization: `Bearer ${token}`
    });
    return res.json();
  }

  async passwordAuth(data: FormData) {
    const res = await this.post(`/login`, data);
    return res.json();
  }

  async getUser(): Promise<IUser> {
    const res = await this.get(`/user`);
    return res.json();
  }

  async logout() {
    const res = await this.post(`/logout`, {});
    return res.json();
  }

  async setFeedback(
    feedback: IFeedback
  ): Promise<{ success: boolean; feedbackId: string }> {
    const res = await this.put(`/feedback`, { feedback });
    return res.json();
  }

  async deleteFeedback(feedbackId: string): Promise<{ success: boolean }> {
    const res = await this.delete(`/feedback`, { feedbackId });
    return res.json();
  }

  async listThreads(
    pagination: IPagination,
    filter: IThreadFilters
  ): Promise<{
    pageInfo: IPageInfo;
    data: IThread[];
  }> {
    const res = await this.post(`/project/threads`, { pagination, filter });

    return res.json();
  }

  async renameThread(threadId: string, name: string) {
    const res = await this.put(`/project/thread`, { threadId, name });

    return res.json();
  }

  async deleteThread(threadId: string) {
    const res = await this.delete(`/project/thread`, { threadId });

    return res.json();
  }

  uploadFile(
    file: File,
    onProgress: (progress: number) => void,
    sessionId: string
  ) {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;

    const promise = new Promise<{ id: string }>((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      xhr.open(
        'POST',
        this.buildEndpoint(`/project/file?session_id=${sessionId}`),
        true
      );

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

  async callAction(action: IAction, sessionId: string) {
    const res = await this.post(`/project/action`, { sessionId, action });

    return res.json();
  }

  async updateElement(element: IElement, sessionId: string) {
    const res = await this.put(`/project/element`, { sessionId, element });

    return res.json();
  }

  async deleteElement(element: IElement, sessionId: string) {
    const res = await this.delete(`/project/element`, { sessionId, element });

    return res.json();
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
