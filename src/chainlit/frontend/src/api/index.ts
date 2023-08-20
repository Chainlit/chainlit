import { IPageInfo, IPagination } from 'components/organisms/dataset/table';

import { IChat, IPrompt } from 'state/chat';
import { IDatasetFilters } from 'state/dataset';
import { IMessageElement } from 'state/element';
import { IMember, Role } from 'state/user';

const devServer = 'http://127.0.0.1:8000';
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

export class ChainlitClient {
  public headers: Headers;

  constructor() {
    this.headers = new Headers({
      'content-type': 'application/json'
    });
  }

  setAccessToken = (accessToken: string) => {
    this.headers.set('Authorization', accessToken);
  };

  static getProjectSettings = async () => {
    const res = await fetch(`${httpEndpoint}/project/settings`, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });

    return res.json();
  };

  fetch = async (resource: string, options: RequestInit) => {
    const res = await fetch(`${httpEndpoint}${resource}`, {
      ...options,
      headers: this.headers
    });

    if (!res.ok) {
      let err: ClientError;
      try {
        const body = await res.json();
        err = new ClientError(res.statusText, body.detail);
      } catch (_) {
        err = new ClientError(res.statusText);
      }
      throw err;
    }
    return res;
  };

  getCompletion = async (
    prompt: IPrompt,
    userEnv = {},
    controller: AbortController,
    tokenCb: (done: boolean, token: string) => void
  ) => {
    const response = await this.fetch(`/completion`, {
      method: 'POST',
      signal: controller.signal,
      body: JSON.stringify({
        prompt: prompt,
        userEnv
      })
    });

    const reader = response.body?.getReader();

    const stream = new ReadableStream({
      start(controller) {
        function push() {
          reader!
            .read()
            .then(({ done, value }) => {
              if (done) {
                controller.close();
                tokenCb(done, '');
                return;
              }
              const string = new TextDecoder('utf-8').decode(value);
              tokenCb(done, string);
              controller.enqueue(value);
              push();
            })
            .catch((err) => {
              controller.close();
              tokenCb(true, '');
              console.error(err);
            });
        }
        push();
      }
    });

    return stream;
  };

  getRole = async () => {
    const res = await this.fetch(`/project/role`, {
      method: 'GET'
    });

    const role = await res.text();
    return role as Role;
  };

  setHumanFeedback = async (messageId: string, feedback: number) => {
    await this.fetch(`/message/feedback`, {
      method: 'PUT',
      body: JSON.stringify({ messageId, feedback })
    });
  };

  getProjectMembers = async (): Promise<IMember[]> => {
    const res = await this.fetch(`/project/members`, {
      method: 'GET'
    });

    return res.json();
  };

  getConversations = async (
    pagination: IPagination,
    filter: IDatasetFilters
  ): Promise<{
    pageInfo: IPageInfo;
    data: IChat[];
  }> => {
    const res = await this.fetch(`/project/conversations`, {
      method: 'POST',
      body: JSON.stringify({ pagination, filter })
    });

    return res.json();
  };

  getConversation = async (conversationId: string): Promise<IChat> => {
    const res = await this.fetch(`/project/conversation/${conversationId}`, {
      method: 'GET'
    });

    return res.json();
  };

  getElement = async (
    conversationId: number | string,
    elementId: number | string
  ): Promise<IMessageElement> => {
    const res = await this.fetch(
      `/project/conversation/${conversationId}/element/${elementId}`,
      {
        method: 'GET'
      }
    );

    return res.json();
  };

  deleteConversation = async (conversationId: number) => {
    const res = await this.fetch(`/project/conversation`, {
      method: 'DELETE',
      body: JSON.stringify({ conversationId })
    });

    return res.json();
  };

  getLLMProviders = async () => {
    const res = await this.fetch(`/project/llm-providers`, {
      headers: {
        'content-type': 'application/json'
      },
      method: 'GET'
    });

    return res.json();
  };
}
