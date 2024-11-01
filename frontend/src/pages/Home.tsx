import { useEffect, useRef } from 'react';
import { useSetRecoilState } from 'recoil';
import { useChatMessages, messagesState } from '@chainlit/react-client';
import Chat from 'components/organisms/chat';
import Page from './Page';
import { threadStorage } from 'services/indexedDB';

export default function Home() {
  const { messages } = useChatMessages();
  const setMessages = useSetRecoilState(messagesState);
  const isLoadedFromDB = useRef(false);
  
  useEffect(() => {
    const loadLastThread = async () => {
      if (!messages.length) {
        const thread = await threadStorage.getLastThread();
        if (thread) {
          setMessages(thread.steps);
          isLoadedFromDB.current = true;
        }
      }
    };
    loadLastThread();
  }, []);

  useEffect(() => {
    const saveChat = async () => {
      if (isLoadedFromDB.current) {
        return;
      }

      const hasUserMessage = messages.some(msg => msg.type === 'user_message');
      
      if (hasUserMessage) {
        const thread = {
          id: Date.now().toString(),
          createdAt: new Date().toISOString(),
          steps: messages,
          name: `Chat ${new Date().toLocaleString()}`
        };
        threadStorage.saveThread(thread);
      }
    };
    saveChat();
  }, [messages]);

  return (
    <Page>
      <Chat />
    </Page>
  );
}
