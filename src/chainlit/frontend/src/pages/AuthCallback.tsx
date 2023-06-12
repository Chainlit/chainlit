import { Alert } from '@mui/material';
import { useAuth } from 'hooks/auth';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const { user, error } = useAuth();
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
