import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@chainlit/react-client';

import { useQuery } from 'hooks/query';

export default function AuthCallback() {
  const query = useQuery();
  const { user, setUserFromAPI } = useAuth();
  const navigate = useNavigate();

  // Fetch user in cookie-based oauth.
  useEffect(() => {
    if (!user) setUserFromAPI();
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  return null;
}
