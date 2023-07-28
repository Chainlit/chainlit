import { grey } from 'palette';
import { CodeProps } from 'react-markdown/lib/ast-to-react';
import { PrismAsync as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useCopyToClipboard, useToggle } from 'usehooks-ts';

import { CopyAll } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';

import useIsDarkMode from 'hooks/useIsDarkMode';

export default function Code({ inline, children, ...props }: CodeProps) {
  const [showTooltip, toggleTooltip] = useToggle();
  const isDarkMode = useIsDarkMode();
  const [value, copy] = useCopyToClipboard();

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
        <Tooltip
          open={showTooltip}
          title={'Copied to clipboard!'}
          onClose={toggleTooltip}
        >
          <IconButton
            sx={{
              color:
                showSyntaxHighlighter || isDarkMode ? grey[200] : grey[800],
              position: 'absolute',
              right: 4,
              top: 4,
              zIndex: 1
            }}
            onClick={() => {
              copy(children[0] as string)
                .then(() => {
                  toggleTooltip();
                  console.log('Successfully copied: ', value);
                })
                .catch((err) =>
                  console.log('An error occurred while copying: ', err)
                );
            }}
          >
            <CopyAll />
          </IconButton>
        </Tooltip>
      ) : null}
      {renderCode()}
    </code>
  );
}
