import { grey } from 'palette';
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
    <Stack spacing={1.5} sx={{ width: '100%' }}>
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {title}
      </Typography>
      <Box
        sx={{
          fontFamily: 'Inter',
          fontSize: '16px',
          lineHeight: '24px',
          padding: 3,
          border: (theme) => `1px solid ${theme.palette.divider}`,
          borderRadius: '0.375rem',
          overflowY: 'auto',
          flexGrow: 1,
          caretColor: (theme) => theme.palette.text.primary,
          backgroundColor: (theme) => theme.palette.background.paper
        }}
      >
        {children}
      </Box>
    </Stack>
  );
}
