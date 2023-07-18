import { grey } from 'palette';

import { Box, useTheme } from '@mui/material';

import { IAudioElement } from 'state/element';

interface Props {
  element: IAudioElement;
}

export default function AudioElement({ element }: Props) {
  const theme = useTheme();
  if (!element.url && !element.content) {
    return null;
  }
  const className = `${element.display}-audio`;
  const src = element.url || URL.createObjectURL(new Blob([element.content!]));
  return (
    <Box className={className}>
      <Box
        sx={{
          fontSize: '14px',
          lineHeight: 1.72,
          color: theme.palette.mode === 'dark' ? grey[300] : grey[700],
          marginBottom: theme.spacing(0.5)
        }}
      >
        {element.name}
      </Box>
      <audio controls src={src}></audio>
    </Box>
  );
}
