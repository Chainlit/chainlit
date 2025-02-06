import { useMessagesStore } from './store/messages';
import { useThreadStore } from './store/thread';
import { useUserState } from './store/user';

const useChatMessages = () => {
  const messages = useMessagesStore((state) => state.messages);
  const firstInteraction = useUserState((state) => state.firstUserInteraction);
  const threadId = useThreadStore((state) => state.currentThreadId);

  return {
    threadId,
    messages,
    firstInteraction
  };
};

export { useChatMessages };
