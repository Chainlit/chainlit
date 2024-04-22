import { useRecoilValue } from 'recoil';

import { firstUserInteraction, messagesState } from './state';

const useChatMessages = () => {
  const messages = useRecoilValue(messagesState);
  const firstInteraction = useRecoilValue(firstUserInteraction);

  const threadId = firstInteraction
    ? messages.find((message) => message.threadId)?.threadId
    : undefined;

  return {
    threadId,
    messages,
    firstInteraction
  };
};

export { useChatMessages };
