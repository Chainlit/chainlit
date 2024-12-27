import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';


import {
  useChatInteract,
  useChatSession,
  useConfig
} from '@chainlit/react-client';


interface Props {
  threadId: string;
}

export default function AutoResumeThread({ threadId }: Props) {
  const navigate = useNavigate();
  const { config } = useConfig();
  const { clear, setIdToResume } = useChatInteract();
  const { session, idToResume } = useChatSession();

  useEffect(() => {   
    if (!config?.threadResumable) return
    clear();
    setIdToResume(threadId!);
    if (!config?.dataPersistence) {
      navigate('/');
    }

  }, [config?.threadResumable])
  
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

  return null
}
