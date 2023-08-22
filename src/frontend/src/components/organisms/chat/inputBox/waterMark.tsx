import { Stack, Typography } from '@mui/material';

import { Logo } from 'components/atoms/logo';

export default function WaterMark() {
  return (
    <Stack mx="auto">
      <a
        href="https://github.com/Chainlit/chainlit"
        target="_blank"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        <Typography fontSize="12px" color="text.secondary">
          Built with
        </Typography>
        <Logo
          width={65}
          style={{ filter: 'grayscale(1)', marginLeft: '4px' }}
        />
      </a>
    </Stack>
  );
}
