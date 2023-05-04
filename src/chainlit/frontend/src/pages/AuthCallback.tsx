import { useAuth0 } from '@auth0/auth0-react';
import { Alert } from '@mui/material';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const { user, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user]);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  return null;
}
