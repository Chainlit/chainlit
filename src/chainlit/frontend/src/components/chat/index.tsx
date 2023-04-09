import { getProjectSettings, postMessage, server } from "api";
import { Alert, Box } from "@mui/material";
import Messages from "./messages";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
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
import { toast } from "react-hot-toast";
import useClearChat from "hooks/clearChat";
import { accessTokenState, userEnvState } from "state/user";
import { IDocument, documentsState } from "state/document";
import { projectSettingsState } from "state/project";

const Chat = () => {
  const { user } = useAuth0();
  const accessToken = useRecoilValue(accessTokenState);
  const userEnv = useRecoilValue(userEnvState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);
  const [documents, setDocuments] = useRecoilState(documentsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [socketError, setSocketError] = useState(false);
  const setPSettings = useSetRecoilState(projectSettingsState);
  const clearChat = useClearChat();

  useEffect(() => {
    if (window.socket) {
      window.socket.disconnect();
      window.socket.removeAllListeners();
    }

    window.socket = io(server, {
      extraHeaders: {
        Authorization: accessToken || "",
        "user-env": JSON.stringify(userEnv),
      },
    });

    window.socket.on("connection", () => {
      console.log("connected");
      setSocketError(false);
    });

    window.socket.on("connect_error", (err) => {
      console.error("failed to connect", err);
      setSocketError(true);
    });

    window.socket.on("reload", (err) => {
      clearChat();
      getProjectSettings().then((res) => setPSettings(res));
    });

    window.socket.on("message", (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    window.socket.on("prompt", (message, callback) => {
      setMessages((oldMessages) => [...oldMessages, message]);
      setLoading(false);
      console.log(callback);
    });

    window.socket.on("document", (document: IDocument) => {
      setDocuments((old) => ({
        ...old,
        ...{ [document.name]: document },
      }));
    });
    window.socket.on("token_usage", (count: number) => {
      setTokenCount((old) => old + count);
    });
  }, [userEnv, accessToken]);

  const onSubmit = async (msg: string) => {
    const message: IMessage = {
      author: user?.name || "User",
      authorIsUser: true,
      content: msg,
    };

    setMessages((oldMessages) => [...oldMessages, message]);
    setLoading(true);
    try {
      await postMessage(message.author, msg);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />
      <Box flexGrow={1} display="flex" flexDirection="column" overflow="scroll">
        <Loading />
        {socketError && (
          <Alert severity="error">Could not reach the server.</Alert>
        )}
        <ChatTopBar />
        <Messages documents={documents} messages={messages} />
        <InputBox onSubmit={onSubmit} />
      </Box>
      <DocumentSideView />
    </Box>
  );
};

export default Chat;
