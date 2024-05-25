import { useAuth } from 'api/auth';

import { Avatar, IconButton, IconButtonProps, Typography } from '@mui/material';

import UserIcon from 'assets/user';

export default function UserAvatar(props: IconButtonProps) {
  const { user } = useAuth();

  return (
    <IconButton {...props}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
        src={user?.metadata?.image || undefined}
      >
        {user ? (
          user.identifier?.[0]?.toUpperCase()
        ) : (
          <UserIcon sx={{ height: 20, width: 20 }} />
        )}
      </Avatar>
    </IconButton>
  );
}
