import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { useChatInteract } from '@chainlit/react-client';

import { copilotThreadIdState } from '../state';

export const useCopilotInteract = () => {
  const chatInteract = useChatInteract();
  const setCopilotThreadId = useSetRecoilState(copilotThreadIdState);

  const startNewChat = useCallback(() => {
    chatInteract.clear();

    const newThreadId = uuidv4();

    setCopilotThreadId(newThreadId);
  }, [chatInteract, setCopilotThreadId]);

  return {
    ...chatInteract,
    clear: startNewChat,
    startNewChat
  };
};
