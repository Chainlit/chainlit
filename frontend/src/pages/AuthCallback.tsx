import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@chainlit/react-client';

export default function AuthCallback() {
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
