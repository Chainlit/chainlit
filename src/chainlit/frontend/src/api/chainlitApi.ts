import { IPageInfo, IPagination } from 'components/organisms/dataset/table';

import { IChat, ILLMSettings } from 'state/chat';
import { IDatasetFilters } from 'state/dataset';

import { api } from '.';

const ChainlitAPI = {
  getCompletion: async (
    prompt: string,
    settings: ILLMSettings,
    userEnv = {},
    accessToken?: string
  ) => {
    const res = await api.post(
      `/completion`,
      { prompt, settings, userEnv },
      accessToken
    );

    const completion = await res.text();
    return completion;
  },

  setHumanFeedback: async (
    messageId: string,
    feedback: number,
    accessToken?: string
  ) => {
    await api.put(`/message/feedback`, { messageId, feedback }, accessToken);
  },

  getConversations: async (
    pagination: IPagination,
    filter: IDatasetFilters,
    accessToken?: string
  ): Promise<{
    pageInfo: IPageInfo;
    data: IChat[];
  }> => {
    const res = await api.post(
      `/project/conversations`,
      { pagination, filter },
      accessToken
    );

    return res?.json();
  },

  deleteConversation: async (conversationId: number, accessToken?: string) => {
    const res = await api.delete(
      `/project/conversation`,
      { conversationId },
      accessToken
    );

    return res?.json();
  }
};

export { ChainlitAPI };
