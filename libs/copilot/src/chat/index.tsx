import { WidgetContext } from 'context';
import { useContext, useEffect } from 'react';

import { useChatInteract, useChatSession } from '@chainlit/react-client';

import ChatBody from './body';

export default function ChatWrapper() {
  const { accessToken, sendCookies } = useContext(WidgetContext);
  const { connect, session } = useChatSession();
  const { sendMessage } = useChatInteract();
  useEffect(() => {
    if (session?.socket?.connected) return;
    connect({
      userEnv: {},
      accessToken: `Bearer ${accessToken}`,
      sendCookies: sendCookies
    });
  }, [connect, accessToken, sendCookies]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitMessage = sendMessage;
  }, [sendMessage]);

  return <ChatBody />;
}
