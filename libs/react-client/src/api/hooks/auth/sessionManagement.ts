import { useContext } from 'react';
import { ChainlitContext } from 'src/index';

import { useAuthState } from './state';
import { useTokenManagement } from './tokenManagement';

export const useSessionManagement = () => {
  const apiClient = useContext(ChainlitContext);
  const { setUser, setThreadHistory, cookieAuth } = useAuthState();
  const { removeToken } = useTokenManagement();

  const logout = async (reload = false): Promise<void> => {
    await apiClient.logout();
    setUser(null);
    setThreadHistory(undefined);

    if (!cookieAuth) {
      removeToken();
    }

    if (reload) {
      window.location.reload();
    }
  };

  return { logout };
};
