import { atom } from 'recoil';

import { IThreadFilters } from '@chainlit/react-client';

export const threadsFiltersState = atom<IThreadFilters>({
  key: 'ThreadsFilters',
  default: {}
});
