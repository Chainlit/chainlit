import { memo } from 'react';

import { Box } from '@mui/material';

import Markdown from 'components/molecules/markdown';

const WelcomeScreen = memo(({ markdown }: { markdown?: string }) => {
  if (!markdown) return <Box flexGrow={1} />;

  return (
    <Box overflow="auto" flexGrow={1}>
      <Box
        id="welcome-screen"
        sx={{
          p: 2,
          boxSizing: 'border-box',
          maxWidth: '60rem',
          width: '100%',
          mx: 'auto',
          color: 'text.primary',
          lineHeight: '25px',
          fontSize: '1rem',
          fontFamily:
            '-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Markdown content={markdown} />
      </Box>
    </Box>
  );
});

export default WelcomeScreen;
