import { useEffect } from 'react';
import { useChatSession, useChatMessages } from '@chainlit/react-client';
import Chat from 'components/organisms/chat';
import Page from './Page';
import { useChatService } from 'services/ChatService';

export const Home = () => {
  const { session } = useChatSession();
  const { messages, threadId } = useChatMessages();
  const chatService = useChatService();

  useEffect(() => {
    if (messages?.length > 0 || !session?.socket?.connected) return;

    chatService.initChat().catch(err => {
      console.error('Failed to initialize chat:', err);
    });
  }, [session?.socket?.connected]);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'pageData' && threadId) {
        await chatService.sendPageAnalytics(threadId, event.data.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [threadId, chatService]);

  return (
    <Page>
      <Chat />
    </Page>
  );
};

export default Home;
