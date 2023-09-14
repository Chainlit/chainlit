import { CodeProps } from 'react-markdown/lib/ast-to-react';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { grey } from 'theme/palette';

import { Box } from '@mui/material';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import { ClipboardCopy } from './ClipboardCopy';

const Code = ({ inline, children, ...props }: CodeProps) => {
  const isDarkMode = useIsDarkMode();

  const match = /language-(\w+)/.exec(props.className || '');
  const showSyntaxHighlighter = !inline && match;

  const renderCode = () => {
    if (showSyntaxHighlighter) {
      return (
        <SyntaxHighlighter
          {...props}
          children={String(children).replace(/\n$/, '')}
          style={dracula}
          customStyle={{ paddingRight: '2.5em' }}
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
            background: isDarkMode ? grey[800] : grey[200],
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
            background: isDarkMode ? grey[800] : grey[200],
            borderRadius: '4px',
            padding: (theme) => theme.spacing(1),
            paddingRight: '2.5em',
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
  };

  return (
    <code style={{ position: 'relative' }}>
      {!inline ? (
        <ClipboardCopy
          value={children[0] as string}
          // If 'showSyntaxHighlighter' is true, force dark theme, otherwise, let the default mode.
          theme={showSyntaxHighlighter ? 'dark' : undefined}
        />
      ) : null}
      {renderCode()}
    </code>
  );
};

export { Code };
