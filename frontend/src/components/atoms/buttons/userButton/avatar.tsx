import { Avatar, IconButton, IconButtonProps } from '@mui/material';

import { useAuth } from '@chainlit/react-client';

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
