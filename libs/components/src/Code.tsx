import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { grey } from 'theme/palette';

import Box from '@mui/material/Box';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import { ClipboardCopy } from './ClipboardCopy';

const Code = ({ children, ...props }: any) => {
  const isDarkMode = useIsDarkMode();
  const codeChildren = props.node?.children?.[0];
  const className = codeChildren?.properties?.className?.[0];
  const match = /language-(\w+)/.exec(className || '');
  const code = codeChildren?.children?.[0]?.value;

  const renderCode = () => {
    if (match && code) {
      return (
        <SyntaxHighlighter
          {...props}
          children={code}
          style={dracula}
          customStyle={{
            paddingRight: '2.5em',
            minHeight: '20px'
          }}
          wrapLongLines
          language={match[1]}
          PreTag="div"
        />
      );
    } else {
      return (
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
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        maxWidth: '90%'
      }}
    >
      <ClipboardCopy
        value={code}
        // If 'showSyntaxHighlighter' is true, force dark theme, otherwise, let the default mode.
        theme={match ? 'dark' : undefined}
      />
      {renderCode()}
    </Box>
  );
};

export { Code };
