import { PropsWithChildren } from 'react';

import Stack from '@mui/material/Stack';

export default function ActionBar({ children }: PropsWithChildren) {
  return (
    <Stack
      direction="row"
      sx={{
        backgroundColor: (theme) => theme.palette.background.paper,
        padding: '16px 24px',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 2
      }}
    >
      {children}
    </Stack>
  );
}
