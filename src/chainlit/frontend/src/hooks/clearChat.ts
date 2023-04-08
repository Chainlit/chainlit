import { useSetRecoilState } from "recoil";
import {
  documentSideViewState,
  documentsState,
  messagesState,
  tokenCountState,
} from "state/chat";

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
