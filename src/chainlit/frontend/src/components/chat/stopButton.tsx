import CloseIcon from '@mui/icons-material/Close';
import { Box } from '@mui/material';
import { useRecoilState, useRecoilValue } from 'recoil';
import { loadingState, sessionState } from 'state/chat';
import { projectSettingsState } from 'state/project';
import GreyButton from 'components/greyButton';

export default function StopButton() {
  const [loading, setLoading] = useRecoilState(loadingState);
  const pSettings = useRecoilValue(projectSettingsState);
  const session = useRecoilValue(sessionState);

  if (!loading || pSettings?.hideCot) {
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
