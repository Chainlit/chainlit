import { Avatar, Box, useTheme } from '@mui/material';

import { useAuth } from 'hooks/auth';

const stringToColor = (string: string | undefined) => {
  if (!string) return '#dcdcdc';
  let hash = 0;
  let i;

  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }

  return color;
};

export default function UserAvatar() {
  const { user } = useAuth();
  const theme = useTheme();

  if (user) {
    return (
      <Avatar
        sx={{ width: 32, height: 32, bgcolor: stringToColor(user.username) }}
        src={user.image || undefined}
      >
        {user.username?.[0]}
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
