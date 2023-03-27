import { server } from "api";
import { Box } from "@mui/material";
import Messages from "./messages";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  accessTokenState,
  agentState,
  documentsState,
  IDocument,
  IMessage,
  loadingState,
  messagesState,
  tokenCountState,
} from "state/chat";
import Loading from "./loading";
import Playground from "components/playground";
import DocumentSideView from "components/document/sideView";
import ChatTopBar from "./topBar";
import InputBox from "./inputBox";
import { useEffect } from "react";
import io from "socket.io-client";

const agentRegexp = /(@\[\w*\]\((\w*)\))/;

const clean = (str: string, regexp: RegExp, prefix = "") => {
  while (str.match(regexp)) {
    const [before, match, entity, after] = str.split(regexp);
    if (match && entity) {
      str = str.replace(match, prefix + entity);
    }
  }
  return str;
};

const Chat = () => {
  const accessToken = useRecoilValue(accessTokenState);
  const setMessages = useSetRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);
  const setDocuments = useSetRecoilState(documentsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAgents = useSetRecoilState(agentState);

  useEffect(() => {
    if (window.socket) return;

    window.socket = io(server, {
      extraHeaders: {
        Authorization: accessToken || "",
      },
    });

    window.socket.on("message", (message: IMessage) => {
      if (message.final || message.is_error) {
        setLoading(false);
      }
      setMessages((oldMessages) => [...oldMessages, message]);
    });
    window.socket.on("document", (document: IDocument) => {
      setDocuments((old) => ({
        ...old,
        ...{ [document.spec.name]: document },
      }));
    });
    window.socket.on("total_tokens", (count: any) => {
      setTokenCount(count);
    });
    window.socket.on("agents", (agents: any) => {
      setAgents(agents);
    });
  }, []);

  const onSubmit = (msg: string) => {
    msg = clean(msg, agentRegexp, "@");

    const message: IMessage = {
      author: "User",
      content: msg,
    };
    setMessages((oldMessages) => [...oldMessages, message]);
    setLoading(true);
    window.socket?.emit("message", { data: msg });
  };

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />
      <Box flexGrow={1} display="flex" flexDirection="column" overflow="scroll">
        <Loading />
        <ChatTopBar />
        <Messages />
        <InputBox onSubmit={onSubmit} />
      </Box>
      <DocumentSideView />
    </Box>
  );
};

export default Chat;
