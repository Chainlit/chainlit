import { useCallback } from 'react';
import { useSetRecoilState } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import { useChatInteract } from '@chainlit/react-client';

import { copilotThreadIdState } from '../state';

export const useCopilotInteract = () => {
  const chatInteract = useChatInteract();
  const setCopilotThreadId = useSetRecoilState(copilotThreadIdState);

  const startNewChat = useCallback(
    (newThreadId?: string) => {
      chatInteract.clear();
      setCopilotThreadId(newThreadId || uuidv4());
    },
    [chatInteract, setCopilotThreadId]
  );

  return {
    ...chatInteract,
    clear: startNewChat,
    startNewChat
  };
};
