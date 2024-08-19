import { Box, Fade, LinearProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

const BorderLinearProgress = styled(LinearProgress)(() => ({
  borderRadius: 5,
  width: '100px'
}));

interface Props {
  show?: boolean;
}

export default function MessageLoader({ show }: Props) {
  const layoutMaxWidth = useLayoutMaxWidth();

  return (
    <Fade in={show}>
      <Box
        sx={{
          maxWidth: layoutMaxWidth,
          width: '100%',
          mx: 'auto',
          borderRadius: '1rem',
          px: 2,
          boxSizing: 'border-box',
          height: 3,
          color: 'text.primary'
        }}
      >
        <BorderLinearProgress color="inherit" />
      </Box>
    </Fade>
  );
}
