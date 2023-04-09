import { useSetRecoilState } from "recoil";
import {
  messagesState,
  tokenCountState,
} from "state/chat";
import { documentSideViewState, documentsState } from "state/document";

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setDocuments = useSetRecoilState(documentsState);
  const setSideView = useSetRecoilState(documentSideViewState);
  const setTokenCount = useSetRecoilState(tokenCountState);

  return () => {
    window.socket?.disconnect();
    window.socket?.connect();
    setMessages([]);
    setDocuments({});
    setSideView(undefined);
    setTokenCount(0);
  };
}
