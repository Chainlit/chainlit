import { useRecoilValue } from 'recoil';

import { firstUserInteraction, messagesState } from './state';

const useChatMessages = () => {
  const messages = useRecoilValue(messagesState);
  const firstInteraction = useRecoilValue(firstUserInteraction);

  return {
    messages,
    firstInteraction
  };
};

export { useChatMessages };
