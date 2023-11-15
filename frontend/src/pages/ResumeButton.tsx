import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box, Button } from '@mui/material';

import { useChatInteract } from '@chainlit/react-client';

import WaterMark from 'components/organisms/chat/inputBox/waterMark';

import { projectSettingsState } from 'state/project';

interface Props {
  conversationId?: string;
}

export default function ResumeButton({ conversationId }: Props) {
  const navigate = useNavigate();
  const pSettings = useRecoilValue(projectSettingsState);
  const { clear, setIdToResume } = useChatInteract();

  if (!conversationId || !pSettings?.conversationResumable) {
    return;
  }

  const onClick = () => {
    clear();
    setIdToResume(conversationId!);
    toast.success('Conversation resumed!');
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
      <Button onClick={onClick} variant="contained">
        Resume conversation
      </Button>
      <WaterMark />
    </Box>
  );
}
