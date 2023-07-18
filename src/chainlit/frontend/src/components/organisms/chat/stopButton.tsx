import { useRecoilState, useRecoilValue } from 'recoil';

import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';

import GreyButton from 'components/atoms/buttons/greyButton';

import { loadingState, sessionState } from 'state/chat';

export default function StopButton() {
  const [loading, setLoading] = useRecoilState(loadingState);
  const session = useRecoilValue(sessionState);

  if (!loading) {
    return null;
  }

  const handleClick = () => {
    setLoading(false);
    session?.socket.emit('stop');
  };

  return (
    <Box margin="auto">
      <GreyButton
        id="stop-button"
        startIcon={<CloseIcon />}
        variant="contained"
        onClick={handleClick}
      >
        Stop task
      </GreyButton>
    </Box>
  );
}
