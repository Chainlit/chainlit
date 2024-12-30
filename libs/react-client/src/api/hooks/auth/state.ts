import { useRecoilState, useSetRecoilState } from 'recoil';
import { authState, threadHistoryState, userState } from 'src/state';

export const useAuthState = () => {
  const [authConfig, setAuthConfig] = useRecoilState(authState);
  const [user, setUser] = useRecoilState(userState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);

  return {
    authConfig,
    setAuthConfig,
    user,
    setUser,
    setThreadHistory
  };
};
