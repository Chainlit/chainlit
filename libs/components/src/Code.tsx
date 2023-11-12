import hljs from 'highlight.js';
import { useEffect, useRef } from 'react';
import { grey } from 'theme/palette';

import Box from '@mui/material/Box';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import 'highlight.js/styles/atom-one-dark.css';

import { ClipboardCopy } from './ClipboardCopy';

const CodeSnippet = ({ language, children }) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      const highlighted =
        codeRef.current.getAttribute('data-highlighted') === 'yes';
      if (!highlighted) {
        hljs.highlightElement(codeRef.current);
      }
    }
  }, []);

  return (
    <pre style={{ margin: 0 }}>
      <code
        ref={codeRef}
        style={{ borderRadius: '4px' }}
        className={`language-${language}`}
      >
        {children}
      </code>
    </pre>
  );
};

const Code = ({ children, ...props }: any) => {
  const isDarkMode = useIsDarkMode();
  const codeChildren = props.node?.children?.[0];
  const className = codeChildren?.properties?.className?.[0];
  const match = /language-(\w+)/.exec(className || '');
  const code = codeChildren?.children?.[0]?.value;

  const showSyntaxHighlighter = match && code;

  const highlightedCode = showSyntaxHighlighter ? (
    <CodeSnippet language={match[1]}>{code}</CodeSnippet>
  ) : null;

  const nonHighlightedCode = showSyntaxHighlighter ? null : (
    <Box
      sx={{
        background: isDarkMode ? grey[900] : grey[200],
        borderRadius: '4px',
        padding: (theme) => theme.spacing(1),
        paddingRight: '2.5em',
        minHeight: '20px',
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

  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: '95%'
      }}
    >
      <ClipboardCopy
        value={code}
        // If 'showSyntaxHighlighter' is true, force dark theme, otherwise, let the default mode.
        theme={match ? 'dark' : undefined}
      />
      {highlightedCode}
      {nonHighlightedCode}
    </Box>
  );
};

export { Code };
