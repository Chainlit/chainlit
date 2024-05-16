import { useRecoilValue } from 'recoil';

import {
  currentThreadIdState,
  firstUserInteraction,
  messagesState
} from './state';

const useChatMessages = () => {
  const messages = useRecoilValue(messagesState);
  const firstInteraction = useRecoilValue(firstUserInteraction);
  const threadId = useRecoilValue(currentThreadIdState);

  return {
    threadId,
    messages,
    firstInteraction
  };
};

export { useChatMessages };
