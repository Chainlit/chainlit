import { grey } from 'theme/palette';

import Box from '@mui/material/Box';
import useTheme from '@mui/material/styles/useTheme';

import { type IAudioElement } from 'client-types/';

const AudioElement = ({ element }: { element: IAudioElement }) => {
  const theme = useTheme();

  if (!element.url) {
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
      <audio controls src={element.url}></audio>
    </Box>
  );
};

export { AudioElement };
