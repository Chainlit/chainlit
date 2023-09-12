const tokenKey = 'token';

export function getToken() {
  try {
    return localStorage.getItem(tokenKey);
  } catch (e) {
    return;
  }
}

export function setToken(token: string) {
  try {
    return localStorage.setItem(tokenKey, token);
  } catch (e) {
    return;
  }
}

export function removeToken() {
  try {
    return localStorage.removeItem(tokenKey);
  } catch (e) {
    return;
  }
}
