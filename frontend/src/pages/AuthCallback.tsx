import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@chainlit/react-client';

import { useQuery } from 'hooks/query';

export default function AuthCallback() {
  const query = useQuery();
  const { user, setAccessToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const token = query.get('access_token');
    setAccessToken(token);
  }, [query]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  return null;
}
