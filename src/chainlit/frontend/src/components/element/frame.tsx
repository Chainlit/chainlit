import { Box, BoxProps } from '@mui/material/';

export default function ElementFrame(props: BoxProps) {
  return (
    <Box
      sx={{
        p: 1,
        boxSizing: 'border-box',
        bgcolor: (theme) =>
          theme.palette.mode === 'light' ? '#EEEEEE' : '#212121',
        borderRadius: '4px',
        display: 'flex'
      }}
    >
      {props.children}
    </Box>
  );
}
