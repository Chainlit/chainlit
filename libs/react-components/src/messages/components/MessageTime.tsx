import { grey } from 'theme/palette';

import Typography from '@mui/material/Typography';

interface Props {
  timestamp: number | string;
}

const MessageTime = ({ timestamp }: Props) => {
  if (!timestamp) return null;
  const dateOptions: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit'
  };
  if (typeof timestamp === 'string' && !timestamp.endsWith('Z')) {
    timestamp = timestamp + 'Z';
  }
  const date = new Date(timestamp).toLocaleTimeString(undefined, dateOptions);
  return (
    <Typography
      sx={{ mt: '1px' }}
      color={grey[500]}
      fontSize="12px"
      lineHeight="unset"
    >
      {date}
    </Typography>
  );
};

export { MessageTime };
