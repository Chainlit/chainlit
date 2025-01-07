import { useContext } from 'react';
import { ChainlitContext } from 'src/index';

import { useAuthState } from './state';

export const useSessionManagement = () => {
  const apiClient = useContext(ChainlitContext);
  const { setUser, setThreadHistory } = useAuthState();

  const logout = async (reload = false): Promise<void> => {
    await apiClient.logout();
    setUser(undefined);
    setThreadHistory(undefined);

    if (reload) {
      window.location.reload();
    }
  };

  return { logout };
};
