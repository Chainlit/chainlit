import { useAuth } from 'api/auth';

import { Avatar, Box } from '@mui/material';

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
        {user.identifier?.[0]}
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
