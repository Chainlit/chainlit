import { Box } from '@mui/material';

export default function Caret() {
  return (
    <Box
      sx={{
        '@keyframes blink': {
          '0%, 50%': {
            opacity: 1
          },
          '51%, 100%': {
            opacity: 0
          }
        },
        display: 'inline-block',
        width: '2px',
        height: '16px',
        backgroundColor: '#000',
        marginLeft: '3px',
        animation: 'blink 1s infinite'
      }}
    />
  );
}
