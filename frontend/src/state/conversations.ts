import { atom } from 'recoil';

export interface IConversationsFilters {
  authorEmail?: string;
  search?: string;
  feedback?: number;
}

export const conversationsFiltersState = atom<IConversationsFilters>({
  key: 'ConversationsFilters',
  default: {}
});
