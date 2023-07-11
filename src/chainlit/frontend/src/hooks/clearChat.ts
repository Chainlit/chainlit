import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionState } from 'state/action';
import { messagesState, sessionState, tokenCountState } from 'state/chat';
import { elementState, sideViewState } from 'state/element';

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setActions = useSetRecoilState(actionState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const session = useRecoilValue(sessionState);

  return () => {
    session?.socket.disconnect();
    if (session) session.socket.auth = {};
    session?.socket.connect();
    setMessages([]);
    setElements([]);
    setActions([]);
    setSideView(undefined);
    setTokenCount(0);
  };
}
