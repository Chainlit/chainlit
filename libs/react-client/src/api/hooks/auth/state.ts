import { useAuthStore } from 'src/store/auth';

export const useAuthState = () => {
  const authConfig = useAuthStore((state) => state.authConfig);
  const setAuthConfig = useAuthStore((state) => state.setAuthConfig);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const setThreadHistory = useAuthStore((state) => state.setThreadHistory);

  return {
    authConfig,
    setAuthConfig,
    user,
    setUser,
    setThreadHistory
  };
};
