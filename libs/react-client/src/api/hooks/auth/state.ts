import { useRecoilState, useSetRecoilState } from 'recoil';
import {
  accessTokenState,
  authState,
  threadHistoryState,
  userState
} from 'src/state';

export const useAuthState = () => {
  const [authConfig, setAuthConfig] = useRecoilState(authState);
  const [user, setUser] = useRecoilState(userState);
  const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
  const setThreadHistory = useSetRecoilState(threadHistoryState);

  return {
    authConfig,
    setAuthConfig,
    user,
    setUser,
    accessToken,
    setAccessToken,
    setThreadHistory,
    cookieAuth: authConfig?.cookieAuth !== false && authConfig?.requireLogin
  };
};
