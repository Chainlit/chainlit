import React from 'react';

import { Box, Stack, Typography } from '@mui/material';

interface Props {
  title: string;
}

export default function EditorWrapper({
  children,
  title
}: React.PropsWithChildren<Props>) {
  return (
    <Stack spacing={1} sx={{ padding: 0.5 }}>
      <Typography fontSize="18px" fontWeight={700} color="text.primary">
        {title}
      </Typography>
      <Box
        sx={{
          fontFamily: 'Inter',
          fontSize: '16px',
          lineHeight: '24px',
          padding: 0.5,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: '0.375rem',
          overflowY: 'auto',
          width: '100%',
          flexGrow: 1,
          caretColor: (theme) => theme.palette.text.primary
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}
