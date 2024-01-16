import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { Box, Button } from '@mui/material';

import { useChatInteract } from '@chainlit/react-client';

import { Translator } from 'components/i18n';
import WaterMark from 'components/organisms/chat/inputBox/waterMark';

import { projectSettingsState } from 'state/project';

interface Props {
  threadId?: string;
}

export default function ResumeButton({ threadId }: Props) {
  const navigate = useNavigate();
  const pSettings = useRecoilValue(projectSettingsState);
  const { clear, setIdToResume } = useChatInteract();

  if (!threadId || !pSettings?.threadResumable) {
    return;
  }

  const onClick = () => {
    clear();
    setIdToResume(threadId!);
    toast.success('Chat resumed!');
    navigate('/');
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1}
      p={2}
      sx={{
        boxSizing: 'border-box',
        width: '100%',
        maxWidth: '60rem',
        m: 'auto',
        justifyContent: 'center'
      }}
    >
      <Button id="resumeThread" onClick={onClick} variant="contained">
        <Translator path="pages.ResumeButton.resumeChat" />
      </Button>
      <WaterMark />
    </Box>
  );
}
