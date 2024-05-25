import { memo } from 'react';

import { Box } from '@mui/material';

import { Markdown } from 'components/molecules/Markdown';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

const Readme = memo(
  ({
    markdown,
    allowHtml,
    latex
  }: {
    markdown?: string;
    allowHtml?: boolean;
    latex?: boolean;
  }) => {
    const layoutMaxWidth = useLayoutMaxWidth();

    if (!markdown) return <Box flexGrow={1} />;

    return (
      <Box overflow="auto" flexGrow={1}>
        <Box
          id="welcome-screen"
          sx={{
            boxSizing: 'border-box',
            maxWidth: layoutMaxWidth,
            width: '100%',
            mx: 'auto',
            color: 'text.primary',
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

export default Readme;
