import { useRecoilValue, useSetRecoilState } from 'recoil';

import { actionState } from 'state/action';
import { messagesState, sessionState, tokenCountState } from 'state/chat';
import {
  avatarState,
  elementState,
  sideViewState,
  tasklistState
} from 'state/element';

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setAvatars = useSetRecoilState(avatarState);
  const setTasklists = useSetRecoilState(tasklistState);
  const setActions = useSetRecoilState(actionState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const session = useRecoilValue(sessionState);

  return () => {
    session?.socket.disconnect();
    session?.socket.connect();
    setMessages([]);
    setElements([]);
    setAvatars([]);
    setTasklists([]);
    setActions([]);
    setSideView(undefined);
    setTokenCount(0);

    // TODO: How do we reset settings? How do we handle this since we used atomFamily()?
  };
}
