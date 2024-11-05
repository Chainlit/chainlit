import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { 
  currentThreadIdState, 
  firstUserInteraction, 
  useChatInteract,
  useChatSession,
  useChatMessages,
  messagesState
} from '@chainlit/react-client';
import Chat from 'components/organisms/chat';
import Page from './Page';
import { threadStorage } from 'services/indexedDB';

export default function Home() {
  const setCurrentThreadId = useSetRecoilState(currentThreadIdState);
  const setFirstInteraction = useSetRecoilState(firstUserInteraction);
  const setMessages = useSetRecoilState(messagesState);
  const { setIdToResume } = useChatInteract();
  const { session } = useChatSession();
  const { messages} = useChatMessages();

  useEffect(() => {
    if (messages?.length > 0) return;
    
    const loadLastThread = async () => {
      try {
        const thread = await threadStorage.getLastThread();
        if (thread?.steps?.length) {
          setCurrentThreadId(thread.id);
          setIdToResume(thread.id);
          setMessages(thread.steps);
          setFirstInteraction('resume');
        }
      } catch (err) {
        console.error('Failed to load last thread:', err);
      }
    };

    if (session?.socket?.connected) {
      loadLastThread();
    }
  }, [session?.socket?.connected]);

  return (
    <Page>
      <Chat />
    </Page>
  );
}
