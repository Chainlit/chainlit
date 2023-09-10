import { httpEndpoint } from 'api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { AuthLogin } from '@chainlit/components';

import { useAuth } from 'hooks/auth';

import { settingsState } from 'state/settings';

export default function Login() {
  const { theme } = useRecoilValue(settingsState);
  const { config, setAccessToken } = useAuth();
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
    if (!config) {
      return;
    }
    if (!config.requireLogin) {
      navigate('/');
    }
    if (config.headerAuth) {
      handleHeaderAuth();
    }
  }, [config, navigate]);

  return (
    <AuthLogin
      title="Login to access the app."
      error={error}
      callbackUrl="/"
      providers={[]}
      onPasswordSignIn={config?.passwordAuth ? handlePasswordLogin : undefined}
      onOAuthSignIn={async () => {}}
      renderLogo={
        <img
          src={`${httpEndpoint}/logo?theme=${theme}`}
          alt="logo"
          style={{ maxWidth: '60%' }}
        />
      }
    />
  );
}
