import { useRecoilValue } from 'recoil';

import { firstUserMessageState, messagesState } from './state';

const useChatMessages = () => {
  const messages = useRecoilValue(messagesState);
  const firstUserMessage = useRecoilValue(firstUserMessageState);

  return {
    messages,
    firstUserMessage
  };
};

export { useChatMessages };
