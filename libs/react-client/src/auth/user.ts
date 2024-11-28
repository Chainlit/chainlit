import { useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { userState } from 'src/state';

import { IUser, useApi } from '..';
import { useAuthConfig } from './config';
import { getToken, useTokenManagement } from './token';

export const useUser = () => {
  console.log('useUser');
  const [user, setUser] = useRecoilState(userState);
  const { cookieAuth, isLoading: authConfigLoading } = useAuthConfig();
  const { handleSetAccessToken } = useTokenManagement();

  const { data: userData, mutate: mutateUserData } = useApi<IUser>(
    cookieAuth ? '/user' : null
  );

  // setUser, only once (prevents callback loops).
  const userDataEffectRun = useRef(false);
  useEffect(() => {
    if (!userDataEffectRun.current && userData) {
      console.log('userData effect');
      console.log('setUser', userData);
      setUser(userData);
      userDataEffectRun.current = true;
    }
  }, [userData]);

  // Not using cookie auth, attempt to get access token from local storage.
  const tokenAuthEffectRun = useRef(false);
  useEffect(() => {
    if (
      !tokenAuthEffectRun.current &&
      !(user && authConfigLoading && cookieAuth)
    ) {
      console.log('tokenAuth', user, cookieAuth);
      const token = getToken();
      if (token) {
        handleSetAccessToken(token);
        tokenAuthEffectRun.current = true;
      }
    }
  }, [user, cookieAuth, authConfigLoading]);

  return {
    user,
    setUserFromAPI: mutateUserData
  };
};
