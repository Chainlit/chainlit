import { useAuthStore } from 'src/store/auth';

export const useAuthState = () => {
  const authConfig = useAuthStore((s) => s.authConfig);
  const setAuthConfig = useAuthStore((s) => s.setAuthConfig);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setThreadHistory = useAuthStore((s) => s.setThreadHistory);

  return {
    authConfig,
    setAuthConfig,
    user,
    setUser,
    setThreadHistory
  };
};
