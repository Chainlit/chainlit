const tokenKey = 'token';

export function getToken() {
  try {
    return localStorage.getItem(tokenKey);
  } catch (_) {
    return;
  }
}

export function setToken(token: string) {
  try {
    return localStorage.setItem(tokenKey, token);
  } catch (_) {
    return;
  }
}

export function removeToken() {
  try {
    return localStorage.removeItem(tokenKey);
  } catch (_) {
    return;
  }
}
