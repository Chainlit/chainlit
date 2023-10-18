import { Avatar, Box } from '@mui/material';

import { useAuth } from 'hooks/auth';

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
        src={user.image || undefined}
      >
        {user.username?.[0]}
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
        />
      </Box>
    );
  }
}
