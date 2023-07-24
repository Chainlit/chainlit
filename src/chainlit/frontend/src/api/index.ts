import { IPageInfo, IPagination } from 'components/organisms/dataset/table';

import { IChat, ILLMSettings } from 'state/chat';
import { IDatasetFilters } from 'state/dataset';
import { IMessageElement } from 'state/element';
import { IMember, Role } from 'state/user';

const devServer = 'http://127.0.0.1:8000';
const url = import.meta.env.DEV ? devServer : window.origin;
const serverUrl = new URL(url);

const httpEndpoint = `${serverUrl.protocol}//${serverUrl.host}`;
export const wsEndpoint = httpEndpoint;

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

  fetch = async (resource: string, options: object) => {
    const res = await fetch(`${httpEndpoint}${resource}`, {
      ...options,
      headers: this.headers
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }
    return res;
  };

  getCompletion = async (
    prompt: string,
    settings: ILLMSettings,
    userEnv = {}
  ) => {
    const res = await this.fetch(`/completion`, {
      method: 'POST',
      body: JSON.stringify({ prompt, settings, userEnv })
    });

    const completion = await res.text();
    return completion;
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
}
