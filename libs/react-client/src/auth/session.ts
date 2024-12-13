import { useContext } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { ChainlitContext } from 'src/context';
import { accessTokenState, threadHistoryState, userState } from 'src/state';

import { useAuthConfig } from './config';
import { removeToken } from './token';

export const useSessionManagement = () => {
  const apiClient = useContext(ChainlitContext);
  const [, setUser] = useRecoilState(userState);
  const [, setAccessToken] = useRecoilState(accessTokenState);

  const { authConfig } = useAuthConfig();
  const setThreadHistory = useSetRecoilState(threadHistoryState);

  const logout = async (reload = false): Promise<void> => {
    await apiClient.logout();
    setUser(null);
    setThreadHistory(undefined);

    if (!authConfig?.cookieAuth) {
      removeToken();
      setAccessToken('');
    }

    if (reload) {
      window.location.reload();
    }
  };

  return {
    logout
  };
};
