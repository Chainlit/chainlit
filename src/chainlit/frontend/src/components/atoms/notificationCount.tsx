import { Box, Typography, useTheme } from '@mui/material';

export default function NotificationCount({
  notificationsCount
}: {
  notificationsCount: number | string;
}): JSX.Element {
  const theme = useTheme();

  return (
    <Box
      display="flex"
      alignItems="center"
      className="notification-count"
      sx={{
        borderRadius: '6px',
        padding: '4px 8px',
        backgroundColor:
          theme.palette.mode === 'light' ? 'grey.100' : 'grey.800'
      }}
    >
      <Typography
        className="notification-count"
        color="text.secondary"
        sx={{
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        {notificationsCount}
      </Typography>
    </Box>
  );
}
