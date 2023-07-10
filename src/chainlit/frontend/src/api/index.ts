import { IPageInfo, IPagination } from 'components/dataset/table';

import { IChat, ILLMSettings } from 'state/chat';
import { IDatasetFilters } from 'state/dataset';
import { IElement } from 'state/element';
import { IMember, Role } from 'state/user';

const devServer = 'http://127.0.0.1:8000';
const url = import.meta.env.DEV ? devServer : window.origin;
const serverUrl = new URL(url);

const httpEndpoint = `${serverUrl.protocol}//${serverUrl.host}`;
export const wsEndpoint = httpEndpoint;

export class ChainlitClient {
  public headers: Headers;

  constructor(accessToken?: string) {
    this.headers = new Headers({
      'content-type': 'application/json',
      Authorization: accessToken || ''
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

  getCompletion = async (
    prompt: string,
    settings: ILLMSettings,
    userEnv = {}
  ) => {
    const res = await fetch(`${httpEndpoint}/completion`, {
      headers: this.headers,
      method: 'POST',
      body: JSON.stringify({ prompt, settings, userEnv })
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    const completion = await res.text();
    return completion;
  };

  getRole = async () => {
    const res = await fetch(`${httpEndpoint}/project/role`, {
      headers: this.headers,
      method: 'GET'
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    const role = await res.text();
    return role as Role;
  };

  setHumanFeedback = async (messageId: number, feedback: number) => {
    const res = await fetch(`${httpEndpoint}/message/feedback`, {
      headers: this.headers,
      method: 'PUT',
      body: JSON.stringify({ messageId, feedback })
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }
  };

  getProjectMembers = async (): Promise<IMember[]> => {
    const res = await fetch(`${httpEndpoint}/project/members`, {
      headers: this.headers,
      method: 'GET'
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };

  getConversations = async (
    pagination: IPagination,
    filter: IDatasetFilters
  ): Promise<{
    pageInfo: IPageInfo;
    data: IChat[];
  }> => {
    const res = await fetch(`${httpEndpoint}/project/conversations`, {
      headers: this.headers,
      method: 'POST',
      body: JSON.stringify({ pagination, filter })
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };

  getConversation = async (conversationId: number): Promise<IChat> => {
    const res = await fetch(
      `${httpEndpoint}/project/conversation/${conversationId}`,
      {
        headers: this.headers,
        method: 'GET'
      }
    );

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };

  getElement = async (
    conversationId: number | string,
    elementId: number | string
  ): Promise<IElement> => {
    const res = await fetch(
      `${httpEndpoint}/project/conversation/${conversationId}/element/${elementId}`,
      {
        headers: this.headers,
        method: 'GET'
      }
    );

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };

  deleteConversation = async (conversationId: number) => {
    const res = await fetch(`${httpEndpoint}/project/conversation`, {
      headers: this.headers,
      method: 'DELETE',
      body: JSON.stringify({ conversationId })
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json();
  };
}
