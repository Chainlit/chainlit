import { useAuthState } from './state';

export const useTokenManagement = () => {
  const { setAccessToken, cookieAuth } = useAuthState();

  const handleSetAccessToken = (token: string) => {
    if (!cookieAuth) {
      localStorage.setItem('accessToken', token);
      setAccessToken(token);
    }
  };

  const removeToken = () => {
    localStorage.removeItem('accessToken');
  };

  return { handleSetAccessToken, removeToken };
};
