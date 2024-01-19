import { memo } from 'react';

import { Box } from '@mui/material';

import { Markdown } from '@chainlit/react-components';

const WelcomeScreen = memo(
  ({
    markdown,
    allowHtml,
    latex,
    variant
  }: {
    markdown?: string;
    allowHtml?: boolean;
    latex?: boolean;
    variant: 'app' | 'copilot';
  }) => {
    if (!markdown) return <Box flexGrow={1} />;

    return (
      <Box overflow="auto" flexGrow={1}>
        <Box
          id="welcome-screen"
          sx={{
            p: variant === 'app' ? 2.5 : 2,
            boxSizing: 'border-box',
            maxWidth: '60rem',
            width: '100%',
            mx: 'auto',
            color: 'text.primary',
            lineHeight: '25px',
            fontSize: variant === 'app' ? '1rem' : '0.9rem',
            fontFamily:
              '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <Markdown allowHtml={allowHtml} latex={latex}>
            {markdown}
          </Markdown>
        </Box>
      </Box>
    );
  }
);

export default WelcomeScreen;
