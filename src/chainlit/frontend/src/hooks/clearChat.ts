import { useRecoilValue, useResetRecoilState, useSetRecoilState } from 'recoil';

import { actionState } from 'state/action';
import {
  chatSettingsState,
  chatSettingsValueState,
  messagesState,
  sessionState,
  tokenCountState
} from 'state/chat';
import { elementState, sideViewState } from 'state/element';
import { sessionIdState } from 'state/user';

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setActions = useSetRecoilState(actionState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const resetChatSettings = useResetRecoilState(chatSettingsState);
  const resetChatSettingsValue = useResetRecoilState(chatSettingsValueState);
  const resetSessionId = useResetRecoilState(sessionIdState);
  const session = useRecoilValue(sessionState);

  return () => {
    session?.socket.emit('clear_session');
    session?.socket.disconnect();
    resetSessionId();
    session?.socket.connect();
    setMessages([]);
    setElements([]);
    setActions([]);
    setSideView(undefined);
    setTokenCount(0);
    resetChatSettings();
    resetChatSettingsValue();
  };
}
