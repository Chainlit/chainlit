import { grey } from 'theme/palette';

import { Box, useTheme } from '@mui/material';

import { IAudioElement } from 'src/types/element';

const AudioElement = ({ element }: { element: IAudioElement }) => {
  const theme = useTheme();

  if (!element.url && !element.content) {
    return null;
  }

  return (
    <Box className={`${element.display}-audio`}>
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
      <audio
        controls
        src={
          element.url ||
          URL.createObjectURL(
            new Blob([element.content!], { type: 'audio/mpeg' })
          )
        }
      ></audio>
    </Box>
  );
};

export { AudioElement };
