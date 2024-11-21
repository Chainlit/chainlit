import { useEffect, useState } from 'react';
import { useChatSession, useChatMessages } from '@chainlit/react-client';
import Chat from 'components/organisms/chat';
import Page from './Page';
import { useChatService } from 'services/ChatService';

export const Home = () => {
  const { session } = useChatSession();
  const { messages, threadId } = useChatMessages();
  const chatService = useChatService();
  const [dataReceived, setDataReceived] = useState(false);

  useEffect(() => {
    if (messages?.length > 0 || !session?.socket?.connected) return;

    chatService.initChat().catch(err => {
      console.error('Failed to initialize chat:', err);
    });
  }, [session?.socket?.connected]);

  useEffect(() => {
    if (dataReceived || !threadId) return;

    const handleMessage = async (event: MessageEvent) => {
      const allowedOrigins = [
        'https://virtocommerce.com',
        'https://docs.virtocommerce.org'
      ];

      if ((event.origin != 'null') && !allowedOrigins.includes(event.origin)) {
        console.warn('Received message from unauthorized origin:', event.origin);
        return;
      }

      if (event.data.type === 'pageData' && threadId) {
        await chatService.sendPageAnalytics(threadId, event.data.data);
        (event.source as Window)?.postMessage(
          { type: 'pageDataReceived' },
          {
            targetOrigin: event.origin
          }
        );
        setDataReceived(true);
        window.removeEventListener('message', handleMessage);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [threadId, chatService, dataReceived]);

  return (
    <Page>
      <Chat />
    </Page>
  );
};

export default Home;
