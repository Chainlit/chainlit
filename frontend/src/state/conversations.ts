import { groupByDate } from 'helpers/groupeByDate';
import { deepEqual } from 'helpers/object';
import { atom } from 'recoil';

import { ConversationsHistory } from 'types/chatHistory';

export interface IConversationsFilters {
  authorEmail?: string;
  search?: string;
  feedback?: number;
}

export const conversationsFiltersState = atom<IConversationsFilters>({
  key: 'ConversationsFilters',
  default: {}
});

export const conversationsHistoryState = atom<ConversationsHistory | undefined>(
  {
    key: 'ConversationsHistory',
    default: {
      conversations: undefined,
      currentConversationId: undefined,
      groupedConversations: undefined
    },
    effects: [
      ({ setSelf, onSet }: { setSelf: any; onSet: any }) => {
        onSet(
          (newValue: ConversationsHistory, oldValue: ConversationsHistory) => {
            let groupedConversations = newValue.groupedConversations;

            if (
              newValue.conversations &&
              oldValue.groupedConversations &&
              !deepEqual(newValue.conversations, oldValue.groupedConversations)
            ) {
              groupedConversations = groupByDate(newValue.conversations);
            }

            setSelf({
              ...newValue,
              groupedConversations
            });
          }
        );
      }
    ]
  }
);
