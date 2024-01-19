import { useRecoilValue } from 'recoil';

import { useAuth as _useAuth } from '@chainlit/react-client';

import { apiClientState } from 'state/apiClient';

export function useAuth() {
  const apiClient = useRecoilValue(apiClientState);
  return _useAuth(apiClient!);
}
