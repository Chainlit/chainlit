import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@chainlit/react-client';

import { useQuery } from 'hooks/query';

export default function AuthCallback() {
  const query = useQuery();
  const { user, setAccessToken, cookieAuth, setUserFromAPI } = useAuth();
  const navigate = useNavigate();

  // Get access token from query in cookieless oauth.
  useEffect(() => {
    if (!cookieAuth) {
      // Get token from query parameters for oauth login.
      const token = query.get('access_token');
      if (token) setAccessToken(token);
    }
  }, [query]);

  // Fetch user in cookie-based oauth.
  useEffect(() => {
    if (!user && cookieAuth) setUserFromAPI();
  }, [cookieAuth]);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  return null;
}
