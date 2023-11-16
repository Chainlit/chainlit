import { apiClient } from 'api';

import { useAuth as _useAuth } from '@chainlit/react-client';

export function useAuth() {
  return _useAuth(apiClient);
}
