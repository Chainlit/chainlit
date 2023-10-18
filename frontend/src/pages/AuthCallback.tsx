import { useEffect } from 'react';
import { redirect } from 'react-router-dom';

import { useAuth } from 'hooks/auth';
import { useQuery } from 'hooks/query';

export default function AuthCallback() {
  const query = useQuery();
  const { user, setAccessToken } = useAuth();

  useEffect(() => {
    const token = query.get('access_token');
    setAccessToken(token);
  }, [query]);

  useEffect(() => {
    if (user) {
      redirect('/');
    }
  }, [user]);

  return null;
}
