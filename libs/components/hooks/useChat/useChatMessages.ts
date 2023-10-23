import { useRecoilValue } from 'recoil';

import { firstUserMessageState, nestedMessagesState } from './state';

const useChatMessages = () => {
  const messages = useRecoilValue(nestedMessagesState);
  const firstUserMessage = useRecoilValue(firstUserMessageState);

  return {
    messages,
    firstUserMessage
  };
};

export { useChatMessages };
