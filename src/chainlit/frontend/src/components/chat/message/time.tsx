import { Typography } from '@mui/material';

interface Props {
  timestamp: number;
}

export default function MessageTime({ timestamp }: Props) {
  if (!timestamp) return null;
  const dateOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };
  const date = new Date(timestamp).toLocaleTimeString(undefined, dateOptions);
  return (
    <Typography lineHeight="24px" color="#9E9E9E" fontSize="11px">
      {date}
    </Typography>
  );
}
