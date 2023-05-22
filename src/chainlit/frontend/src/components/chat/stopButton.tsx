import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import { useRecoilState, useRecoilValue } from 'recoil';
import { loadingState, sessionState } from 'state/chat';
import GreyButton from 'components/greyButton';

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
        startIcon={<CloseIcon />}
        variant="contained"
        onClick={handleClick}
      >
        Stop task
      </GreyButton>
    </Box>
  );
}
