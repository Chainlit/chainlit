import { useSetRecoilState } from "recoil";
import {
  messagesState,
  tokenCountState,
} from "state/chat";
import { sideViewState, elementState } from "state/element";

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setElements = useSetRecoilState(elementState);
  const setSideView = useSetRecoilState(sideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);

  return () => {
    window.socket?.disconnect();
    window.socket?.connect();
    setMessages([]);
    setElements({});
    setSideView(undefined);
    setTokenCount(0);
  };
}
