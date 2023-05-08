import { Stack, Typography } from '@mui/material';
import { Logo } from 'components/logo';

export default function Powered() {
  return (
    <Stack mx="auto" direction="row" alignItems="center" spacing={0.5}>
      <Typography fontSize="12px" color="text.secondary">
        Powered by
      </Typography>
      <Logo width={65} style={{ filter: 'grayscale(1)' }} />
    </Stack>
  );
}
