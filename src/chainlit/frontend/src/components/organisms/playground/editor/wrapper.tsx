import merge from 'lodash/merge';
import { grey } from 'palette';
import React from 'react';

import { Box, Stack, SxProps, Theme, Typography } from '@mui/material';

interface Props {
  title?: string;
  sx?: SxProps<Theme>;
  sxChildren?: SxProps<Theme>;
  className?: string;
}

export default function EditorWrapper({
  children,
  title,
  sx,
  className,
  sxChildren
}: React.PropsWithChildren<Props>) {
  return (
    <Stack
      spacing={title ? 1.5 : 0}
      sx={merge({ width: '100%', flex: 1, overflowY: 'auto' }, sx)}
    >
      <Typography fontSize="14px" fontWeight={700} color={grey[400]}>
        {title}
      </Typography>
      <Box
        className={className}
        sx={merge(
          {
            fontFamily: 'Inter',
            fontSize: '16px',
            lineHeight: '24px',
            padding: 3,
            border: (theme: Theme) => `1px solid ${theme.palette.divider}`,
            borderRadius: '0.375rem',
            overflowY: 'auto',
            flexGrow: 1,
            caretColor: (theme: Theme) => theme.palette.text.primary,
            backgroundColor: (theme: Theme) => theme.palette.background.paper
          },
          sxChildren
        )}
      >
        {children}
      </Box>
    </Stack>
  );
}
