import { grey } from 'theme/palette';

import Box from '@mui/material/Box';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

const InlineCode = ({ children, ...props }: any) => {
  const isDarkMode = useIsDarkMode();
  return (
    <Box
      sx={{
        display: 'inline',
        position: 'relative'
      }}
    >
      <code
        {...props}
        style={{
          background: isDarkMode ? grey[900] : grey[200],
          borderRadius: '4px',
          padding: '0.2em 0.4em',
          overflowX: 'auto'
        }}
      >
        {children}
      </code>
    </Box>
  );
};

export { InlineCode };
