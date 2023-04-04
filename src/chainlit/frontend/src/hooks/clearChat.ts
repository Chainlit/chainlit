import { useSetRecoilState } from "recoil";
import {
  documentSideViewState,
  documentsState,
  messagesState,
} from "state/chat";

export default function useClearChat() {
  const setMessages = useSetRecoilState(messagesState);
  const setDocuments = useSetRecoilState(documentsState);
  const setSideView = useSetRecoilState(documentSideViewState);

  return () => {
    window.socket?.disconnect();
    window.socket?.connect();
    setMessages([]);
    setDocuments({});
    setSideView(undefined);
  };
}
