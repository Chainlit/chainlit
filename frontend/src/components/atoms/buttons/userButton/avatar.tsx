import { useAuth } from 'api/auth';

import { Avatar, Box } from '@mui/material';

import UserIcon from 'assets/user';

export default function UserAvatar() {
  const { user } = useAuth();

  if (user) {
    return (
      <Avatar
        sx={{
          width: 32,
          height: 32,
          bgcolor: 'primary.main',
          color: 'primary.contrastText'
        }}
        src={user.metadata?.image || undefined}
      >
        {user.identifier?.[0]?.toUpperCase()}
      </Avatar>
    );
  } else {
    return (
      <Box>
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'primary.main',
            color: 'primary.contrastText'
          }}
        >
          <UserIcon sx={{ width: 20 }} />
        </Avatar>
      </Box>
    );
  }
}
