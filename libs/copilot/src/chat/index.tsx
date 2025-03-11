import { useEffect,useContext } from 'react';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import ChatBody from './body';
import { WidgetContext } from '@/context';

export default function ChatWrapper() {
  const { accessToken } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  const { sendMessage } = useChatInteract();
  
  useEffect(() => {
    if (session?.socket?.connected) return;
    connect({
      // @ts-expect-error window typing
      transports: window.transports,
      userEnv: {},
      accessToken: `Bearer ${accessToken}`
    });
  }, [connect]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitMessage = sendMessage;
  }, [sendMessage]);

  return <ChatBody />;
}
