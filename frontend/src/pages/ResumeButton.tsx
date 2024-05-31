import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { Box, Button } from '@mui/material';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import { Translator } from 'components/i18n';
import WaterMark from 'components/organisms/chat/inputBox/waterMark';

import { useLayoutMaxWidth } from 'hooks/useLayoutMaxWidth';

import { projectSettingsState } from 'state/project';

interface Props {
  threadId?: string;
}

export default function ResumeButton({ threadId }: Props) {
  const navigate = useNavigate();
  const layoutMaxWidth = useLayoutMaxWidth();
  const pSettings = useRecoilValue(projectSettingsState);
  const { clear, setIdToResume } = useChatInteract();
  const { session, idToResume } = useChatSession();

  useEffect(() => {
    if (threadId !== idToResume) {
      return;
    }
    if (session?.socket.connected) {
      toast.success('Chat resumed successfully');
    } else if (session?.error) {
      toast.error("Couldn't resume chat");
    }
  }, [session, idToResume, threadId]);

  if (!threadId || !pSettings?.threadResumable) {
    return null;
  }

  const onClick = () => {
    clear();
    setIdToResume(threadId!);
    if (!pSettings?.dataPersistence) {
      navigate('/');
    }
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
        maxWidth: layoutMaxWidth,
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
