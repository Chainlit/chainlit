import { IConversation } from 'src/types';

import { IPageInfo } from '..';

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
