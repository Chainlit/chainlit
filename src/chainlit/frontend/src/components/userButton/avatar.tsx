import { Avatar, Box, useTheme } from '@mui/material';

import { useAuth } from 'hooks/auth';

export default function UserAvatar() {
  const { user } = useAuth();
  const theme = useTheme();

  if (user) {
    return (
      <Avatar sx={{ width: 32, height: 32 }} src={user.picture || undefined}>
        {user.name?.[0]}
      </Avatar>
    );
  } else {
    return (
      <Box
        color={theme.palette.mode === 'dark' ? 'text.primary' : 'primary.main'}
      >
        <Avatar
          sx={{
            width: 32,
            height: 32,
            bgcolor: 'transparent',
            color: 'inherit'
          }}
        />
      </Box>
    );
  }
}
