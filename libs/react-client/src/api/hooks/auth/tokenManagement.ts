import { useAuthState } from './state';

const tokenKey = 'token';

export function getToken(): string | null | undefined {
  try {
    return localStorage.getItem(tokenKey);
  } catch (_) {
    return;
  }
}

export function setToken(token: string): void {
  try {
    return localStorage.setItem(tokenKey, token);
  } catch (_) {
    return;
  }
}

export function removeToken(): void {
  try {
    return localStorage.removeItem(tokenKey);
  } catch (_) {
    return;
  }
}

export function ensureTokenPrefix(token: string): string {
  const prefix = 'Bearer ';
  if (token.startsWith(prefix)) {
    return token;
  } else {
    return prefix + token;
  }
}

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
