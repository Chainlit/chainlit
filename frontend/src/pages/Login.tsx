import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginForm } from '@/components/LoginForm';
import { Logo } from '@/components/Logo';
import { useTheme } from '@/components/ThemeProvider';
import { LanguageSwitcher } from '@/components/header/LanguageSwitcher';

import { useQuery } from 'hooks/query';

import { ChainlitContext, useAuth } from 'client-types/*';

export const LoginError = new Error(
  'Error logging in. Please try again later.'
);

export default function Login() {
  const query = useQuery();
  const { data: config, user, setUserFromAPI } = useAuth();
  const [error, setError] = useState('');
  const apiClient = useContext(ChainlitContext);
  const navigate = useNavigate();
  const { variant } = useTheme();
  const isDarkMode = variant === 'dark';

  const handleCookieAuth = (json: any): void => {
    if (json?.success != true) throw LoginError;

    // Validate login cookie and get user data.
    setUserFromAPI();
  };

  const handleAuth = async (
    jsonPromise: Promise<any>,
    redirectURL?: string
  ) => {
    try {
      const json = await jsonPromise;

      handleCookieAuth(json);

      if (redirectURL) {
        navigate(redirectURL);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleHeaderAuth = async () => {
    const jsonPromise = apiClient.headerAuth();

    // Why does apiClient redirect to '/' but handlePasswordLogin to callbackUrl?
    await handleAuth(jsonPromise, '/');
  };

  const handlePasswordLogin = async (username: string, password: string) => {
    const formData = new FormData();
    formData.append('username', username);
    formData.append('password', password);

    const jsonPromise = apiClient.passwordAuth(formData);
    await handleAuth(jsonPromise);
  };

  useEffect(() => {
    setError(query.get('error') || '');
  }, [query]);

  useEffect(() => {
    if (!config) {
      return;
    }
    if (!config.requireLogin) {
      navigate('/');
    }
    if (config.headerAuth) {
      handleHeaderAuth();
    }
    if (user) {
      navigate('/');
    }
  }, [config, user]);

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex flex-col gap-8 w-full max-w-sm">
        <div className="flex justify-center">
          <Logo className="w-[150px]" />
        </div>
        <LoginForm
          error={error}
          callbackUrl="/"
          providers={config?.oauthProviders || []}
          onPasswordSignIn={
            config?.passwordAuth ? handlePasswordLogin : undefined
          }
          onOAuthSignIn={async (provider: string) => {
            window.location.href = apiClient.getOAuthEndpoint(provider);
          }}
        />
      </div>
    </div>
  );
}
