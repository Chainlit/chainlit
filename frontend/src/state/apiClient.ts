import { apiClient } from 'api';
import { atom } from 'recoil';

import { ChainlitAPI } from '@chainlit/react-client';

export const apiClientState = atom<ChainlitAPI>({
  key: 'ApiClient',
  default: apiClient
});
