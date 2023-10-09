import { httpEndpoint } from 'api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { AuthLogin } from '@chainlit/components';

import { Logo } from 'components/atoms/logo';

import { useAuth } from 'hooks/auth';
import { useQuery } from 'hooks/query';

export default function Login() {
  const query = useQuery();
  const { config, setAccessToken, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleHeaderAuth = async () => {
    const res = await fetch(httpEndpoint + '/auth/header', {
      method: 'post'
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.detail);
    } else if (json?.access_token) {
      setAccessToken(json.access_token);
      navigate('/');
    }
  };

  const handlePasswordLogin = async (
    email: string,
    password: string,
    callbackUrl: string
  ) => {
    const formData = new FormData();
    formData.append('username', email);
    formData.append('password', password);

    const res = await fetch(httpEndpoint + '/login', {
      method: 'post',
      body: formData
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.detail);
    } else if (json?.access_token) {
      setAccessToken(json.access_token);
      navigate(callbackUrl);
    }
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
    <AuthLogin
      title="Login to access the app."
      error={error}
      callbackUrl="/"
      providers={config?.oauthProviders || []}
      onPasswordSignIn={config?.passwordAuth ? handlePasswordLogin : undefined}
      onOAuthSignIn={async (provider: string) => {
        window.location.href = httpEndpoint + '/auth/oauth/' + provider;
      }}
      renderLogo={<Logo style={{ maxWidth: '60%', maxHeight: '90px' }} />}
    />
  );
}
