import { useRecoilValue, useSetRecoilState } from 'recoil';
import { messagesState, sessionState, tokenCountState } from 'state/chat';
import { sideViewState, elementState } from 'state/element';

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const session = useRecoilValue(sessionState);

  return () => {
    session?.socket.disconnect();
    session?.socket.connect();
    setMessages([]);
    setElements({});
    setSideView(undefined);
    setTokenCount(0);
  };
}
