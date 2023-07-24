import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';

import { actionState } from 'state/action';
import { messagesState, sessionState, tokenCountState } from 'state/chat';
import {
  avatarState,
  elementState,
  sideViewState,
  tasklistState
} from 'state/element';
import { sessionIdState } from 'state/user';

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setAvatars = useSetRecoilState(avatarState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const resetSessionId = useResetRecoilState(sessionIdState);
  const session = useRecoilValue(sessionState);

  return () => {
    session?.socket.emit('clear_session');
    session?.socket.disconnect();
    resetSessionId();
    session?.socket.connect();
    setMessages([]);
    setElements([]);
    setAvatars([]);
    setTasklists([]);
    setActions([]);
    setSideView(undefined);
    setTokenCount(0);
  };
}
