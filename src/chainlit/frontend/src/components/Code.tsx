import { Box, useTheme } from '@mui/material';
import { CodeProps } from 'react-markdown/lib/ast-to-react';

export default function Code({ inline, children, ...props }: CodeProps) {
  const theme = useTheme();
  if (inline) {
    return (
      <code
        {...props}
        style={{
          background: theme.palette.divider,
          borderRadius: '4px',
          padding: theme.spacing(0.5)
        }}
      >
        {children}
      </code>
    );
  } else {
    return (
      <Box
        sx={{
          background: theme.palette.divider,
          borderRadius: '4px',
          padding: theme.spacing(1)
        }}
      >
        <code {...props}>{children}</code>
      </Box>
    );
  }
}
