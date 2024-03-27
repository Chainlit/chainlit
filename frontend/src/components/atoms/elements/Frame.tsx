import { grey } from 'theme/palette';

import Box from '@mui/material/Box';

const FrameElement = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      p: 1,
      boxSizing: 'border-box',
      bgcolor: (theme) =>
        theme.palette.mode === 'light' ? grey[200] : grey[900],
      borderRadius: '4px',
      display: 'flex'
    }}
  >
    {children}
  </Box>
);

export { FrameElement };
