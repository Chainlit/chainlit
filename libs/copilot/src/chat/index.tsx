import { useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import {
  threadIdToResumeState,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';

import { copilotThreadIdState } from '../state';
import ChatBody from './body';

export default function ChatWrapper() {
  const { connect, session, idToResume } = useChatSession();
  const { sendMessage } = useChatInteract();
  const copilotThreadId = useRecoilValue(copilotThreadIdState);
  const setThreadIdToResume = useSetRecoilState(threadIdToResumeState);
  const hasConnected = useRef<boolean>(false);
  const lastConnectedThreadId = useRef<string | null>(null);

  useEffect(() => {
    if (!copilotThreadId) {
      return;
    }

    setThreadIdToResume(copilotThreadId);
  }, [copilotThreadId, setThreadIdToResume]);

  useEffect(() => {
    if (
      copilotThreadId &&
      lastConnectedThreadId.current &&
      copilotThreadId !== lastConnectedThreadId.current &&
      hasConnected.current
    ) {
      if (session?.socket?.connected) {
        session.socket.disconnect();
      }
      hasConnected.current = false;
      lastConnectedThreadId.current = null;
    }
  }, [copilotThreadId]);

  useEffect(() => {
    if (!copilotThreadId || !idToResume || copilotThreadId !== idToResume) {
      return;
    }

    if (hasConnected.current) {
      return;
    }

    hasConnected.current = true;
    lastConnectedThreadId.current = copilotThreadId;
    connect({
      // @ts-expect-error window typing
      transports: window.transports,
      userEnv: {}
    });
  }, [copilotThreadId, idToResume, connect]);

  useEffect(() => {
    // @ts-expect-error is not a valid prop
    window.sendChainlitMessage = sendMessage;
  }, [sendMessage]);

  return <ChatBody />;
}
