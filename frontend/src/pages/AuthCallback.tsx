import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// import { Alert } from '@mui/material';
import { useAuth } from 'hooks/auth';

export default function AuthCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // if (error) {
  //   return <Alert severity="error">{error.message}</Alert>;
  // }
  return null;
}
