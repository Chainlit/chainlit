import { Box, BoxProps } from '@mui/material/';
import { grey } from 'palette';

export default function ElementFrame(props: BoxProps) {
  return (
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
      {props.children}
    </Box>
  );
}
