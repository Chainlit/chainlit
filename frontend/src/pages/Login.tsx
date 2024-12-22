import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Translator } from 'components/i18n';
import { AuthLogin } from 'components/molecules/auth';

import { useQuery } from 'hooks/query';

import { ChainlitContext, useAuth } from 'client-types/*';
import { Logo } from '@/components/Logo';
import { LoginForm } from '@/components/LoginForm';

export const LoginError = new Error(
  'Error logging in. Please try again later.'
);

export default function Login() {
  const query = useQuery();
  const {
    data: config,
    setAccessToken,
    user,
    cookieAuth,
    setUserFromAPI
  } = useAuth();
  const [error, setError] = useState('');
  const apiClient = useContext(ChainlitContext);

  const navigate = useNavigate();

  const handleTokenAuth = (json: any): void => {
    // Handle case where access_token is in JSON reply.
    const access_token = json.access_token;
    if (access_token) return setAccessToken(access_token);
    throw LoginError;
  };

  const handleCookieAuth = (json: any): void => {
    if (json?.success != true) throw LoginError;

    // Validate login cookie and get user data.
    setUserFromAPI();
  };

  const handleAuth = async (jsonPromise: Promise<any>, redirectURL: string) => {
    try {
      const json = await jsonPromise;

      if (!cookieAuth) {
        handleTokenAuth(json);
      } else {
        handleCookieAuth(json);
      }

      navigate(redirectURL);
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleHeaderAuth = async () => {
    const jsonPromise = apiClient.headerAuth();

    // Why does apiClient redirect to '/' but handlePasswordLogin to callbackUrl?
    handleAuth(jsonPromise, '/');
  };

  const handlePasswordLogin = async (
    email: string,
    password: string,
    callbackUrl: string
  ) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const jsonPromise = apiClient.passwordAuth(formData);
    handleAuth(jsonPromise, callbackUrl);
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
    <div className="grid min-h-svh lg:grid-cols-2">
    <div className="flex flex-col gap-4 p-6 md:p-10">
      <div className="flex justify-center gap-2 md:justify-start">
      <Logo className='w-[150px]' />
      </div>
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-xs">
          <LoginForm
               error={error}
               callbackUrl="/"
               providers={config?.oauthProviders || []}
               onPasswordSignIn={config?.passwordAuth ? handlePasswordLogin : undefined}
               onOAuthSignIn={async (provider: string) => {
                 window.location.href = apiClient.getOAuthEndpoint(provider);
               }}
          />
        </div>
      </div>
    </div>
    <div className="relative hidden bg-muted lg:block">
      <img
        src={apiClient.buildEndpoint("/favicon")}
        alt="Image"
        className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
      />
    </div>
  </div>
  );
}
