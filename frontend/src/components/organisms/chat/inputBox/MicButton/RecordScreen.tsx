import { grey } from 'theme/palette';

import { Box } from '@mui/material';
import Backdrop from '@mui/material/Backdrop';

import MicrophoneIcon from 'assets/microphone';

interface Props {
  open?: boolean;
  isSpeaking?: boolean;
}

export default function RecordScreen({ open, isSpeaking }: Props) {
  return (
    <Backdrop
      sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
      open={!!open}
    >
      <Box
        height={300}
        width={300}
        position="relative"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <svg height="160" width="160" xmlns="http://www.w3.org/2000/svg">
          <circle r="80" cx="80" cy="80" fill={grey[50]} />
        </svg>
        <svg
          height="240"
          width="240"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            position: 'absolute',
            zIndex: -1,
            transition: 'transform 500ms ease-in-out',
            opacity: 0.5,
            transform: isSpeaking ? 'scale(1)' : 'scale(0)'
          }}
        >
          <circle r="120" cx="120" cy="120" fill={grey[50]} />
        </svg>
        <MicrophoneIcon
          sx={{
            height: 87,
            width: 87,
            color: 'primary.main',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        />
      </Box>
    </Backdrop>
  );
}
