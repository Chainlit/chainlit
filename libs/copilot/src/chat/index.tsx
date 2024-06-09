import { WidgetContext } from 'context';
import { useContext, useEffect } from 'react';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import ChatBody from './body';

export default function ChatWrapper() {
  const { apiClient, accessToken } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  const { sendSystemMessage } = useChatInteract();
  useEffect(() => {
    if (session?.socket?.connected) return;
    connect({
      client: apiClient,
      userEnv: {},
      accessToken: `Bearer ${accessToken}`
    });
  }, [connect, accessToken, apiClient]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitSystemMessage = sendSystemMessage;
  }, [sendSystemMessage]);

  return <ChatBody />;
}
