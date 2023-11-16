import { atom } from 'recoil';

import { IConversationsFilters } from '@chainlit/react-client';

export const conversationsFiltersState = atom<IConversationsFilters>({
  key: 'ConversationsFilters',
  default: {}
});
