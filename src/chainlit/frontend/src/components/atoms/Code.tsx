import { grey } from 'palette';
import { CodeProps } from 'react-markdown/lib/ast-to-react';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

import { Box, useTheme } from '@mui/material';

export default function Code({ inline, children, ...props }: CodeProps) {
  const theme = useTheme();

  const match = /language-(\w+)/.exec(props.className || '');
  if (!inline && match) {
    return (
      <SyntaxHighlighter
        {...props}
        children={String(children).replace(/\n$/, '')}
        style={dracula}
        wrapLongLines
        language={match[1]}
        PreTag="div"
      />
    );
  } else if (inline) {
    return (
      <code
        {...props}
        style={{
          background: theme.palette.mode === 'dark' ? grey[800] : grey[200],
          borderRadius: '4px',
          padding: '0.2em 0.4em',
          overflowX: 'auto'
        }}
      >
        {children}
      </code>
    );
  } else {
    return (
      <Box
        sx={{
          background: theme.palette.mode === 'dark' ? grey[800] : grey[200],
          borderRadius: '4px',
          padding: theme.spacing(1),
          overflowX: 'auto'
        }}
      >
        <code
          {...props}
          style={{
            whiteSpace: 'pre-wrap'
          }}
        >
          {children}
        </code>
      </Box>
    );
  }
}
