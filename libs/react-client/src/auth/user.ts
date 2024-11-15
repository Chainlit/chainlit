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
    cookieAuth ? '/user' : null,
    {
      onErrorRetry: (...args) => {
        const [err, _, config] = args;

        // Don't do automatic retry for 401 - it just means we're not logged in (yet).
        // TODO: Consider setUser(null) if (user)
        if (err.status === 401) return;

        // Fall back to default behavior.
        return config.onErrorRetry(...args);
      }
    }
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
