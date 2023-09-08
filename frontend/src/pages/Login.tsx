import { httpEndpoint } from 'api';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { AuthLogin } from '@chainlit/components';

import { useAuth } from 'hooks/auth';

import { settingsState } from 'state/settings';

export default function Login() {
  const { theme } = useRecoilValue(settingsState);
  const { config, setAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!config) {
      return;
    }
    if (!config.requireLogin) {
      navigate('/');
    }
  }, [config, navigate]);

  return (
    <AuthLogin
      title=""
      callbackUrl="/"
      providers={[]}
      onPasswordSignIn={async (email, password, callbackUrl) => {
        const formData = new FormData();
        formData.append('username', email);
        formData.append('password', password);

        const res = await fetch(httpEndpoint + '/login', {
          method: 'post',
          body: formData
        });

        const json = await res.json();
        if (json?.access_token) {
          setAccessToken(json.access_token);
          navigate(callbackUrl);
        }
      }}
      onOAuthSignIn={async () => {}}
      renderLogo={<img src={`/logo?theme=${theme}`} alt="logo" />}
    />
  );
}
