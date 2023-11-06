import { IConversation } from '@chainlit/components';

import { IPageInfo } from 'components/organisms/conversationsHistory/sidebar/ConversationsHistoryList';

export type MessageHistory = {
  content: string;
  createdAt: number;
};

export type ConversationsHistory = {
  conversations?: IConversation[];
  currentConversationId?: string;
  groupedConversations?: { [key: string]: IConversation[] };
  pageInfo?: IPageInfo;
};
