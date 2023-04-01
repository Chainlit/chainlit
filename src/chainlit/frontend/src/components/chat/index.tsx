import { postMessage, server } from "api";
import { Alert, Box } from "@mui/material";
import Messages from "./messages";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
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
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { useAuth0 } from "@auth0/auth0-react";

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
  const { user } = useAuth0();
  const accessToken = useRecoilValue(accessTokenState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);
  const [documents, setDocuments] = useRecoilState(documentsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setAgents = useSetRecoilState(agentState);
  const [socketError, setSocketError] = useState(false);

  useEffect(() => {
    if (window.socket) return;

    window.socket = io(server, {
      extraHeaders: {
        Authorization: accessToken || "",
      },
    });

    window.socket.on("connection", () => {
      setSocketError(false);
    });

    window.socket.on("connect_error", () => {
      setSocketError(true);
    });

    window.socket.on("message", (message: IMessage) => {
      if (message.final || message.isError) {
        setLoading(false);
      }
      setMessages((oldMessages) => [...oldMessages, message]);
    });
    window.socket.on("document", (document: IDocument) => {
      setDocuments((old) => ({
        ...old,
        ...{ [document.name]: document },
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
      author: user?.name || "Anonymous",
      authorIsUser: true,
      content: msg,
    };

    setMessages((oldMessages) => [...oldMessages, message]);
    setLoading(true);
    postMessage(message.author, msg);
    // window.socket?.emit("message", message);
  };

  if (socketError)
    return (
      <Box display="flex" width="100%">
        <Alert sx={{ m: "auto" }} variant="filled" severity="error">
          Could not reach the server.
        </Alert>
      </Box>
    );

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />
      <Box flexGrow={1} display="flex" flexDirection="column" overflow="scroll">
        <Loading />
        <ChatTopBar />
        <Messages documents={documents} messages={messages} />
        <InputBox onSubmit={onSubmit} />
      </Box>
      <DocumentSideView />
    </Box>
  );
};

export default Chat;
