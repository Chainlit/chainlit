import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from 'hooks/auth';

export default function Login() {
  const { loginWithRedirect, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      loginWithRedirect({
        authorizationParams: {
          audience: 'chainlit-cloud'
        }
      });
    } else navigate('/');
  }, [isAuthenticated]);

  return null;
}
