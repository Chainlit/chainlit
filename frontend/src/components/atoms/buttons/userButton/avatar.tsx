import { useAuth } from 'api/auth';

import SettingsIcon from '@mui/icons-material/Settings';
import { Avatar, Button, ButtonProps, Typography } from '@mui/material';

export default function UserAvatar(props: ButtonProps) {
  const { user } = useAuth();

  return (
    <Button
      sx={{
        color: 'text.secondary',
        textTransform: 'none',
        justifyContent: 'start'
      }}
      startIcon={
        user ? (
          <Avatar
            sx={{
              width: 24,
              height: 24,
              bgcolor: 'primary.main',
              color: 'primary.contrastText'
            }}
            src={user.metadata?.image || undefined}
          >
            <Typography variant="caption">
              {user.identifier?.[0]?.toUpperCase()}
            </Typography>
          </Avatar>
        ) : (
          <SettingsIcon sx={{ height: 20, width: 20 }} />
        )
      }
      {...props}
    >
      {user ? user.identifier : 'Settings'}
    </Button>
  );
}
