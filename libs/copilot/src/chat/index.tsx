import { WidgetContext } from 'context';
import { useContext, useEffect } from 'react';

import { useChatSession } from '@chainlit/react-client';

import ChatBody from './body';

export default function ChatWrapper() {
  const { apiClient, accessToken } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  useEffect(() => {
    if (session?.socket?.connected) return;
    connect({
      client: apiClient,
      userEnv: {},
      accessToken: `Bearer ${accessToken}`
    });
  }, [connect, accessToken, apiClient]);

  return <ChatBody />;
}
