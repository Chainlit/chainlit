import { getProjectSettings, postMessage, server } from "api";
import { Alert, Box } from "@mui/material";
import MessageContainer from "./message/container";
import { useRecoilState, useRecoilValue, useSetRecoilState } from "recoil";
import {
  IMessage,
  askUserState,
  loadingState,
  messagesState,
  tokenCountState,
} from "state/chat";
import Playground from "components/playground";
import DocumentSideView from "components/document/sideView";
import ChatTopBar from "./topBar";
import InputBox from "./inputBox";
import { useEffect, useState } from "react";
import io from "socket.io-client";
import { toast } from "react-hot-toast";
import useClearChat from "hooks/clearChat";
import { userEnvState } from "state/user";
import { IDocument, documentsState } from "state/document";
import { projectSettingsState } from "state/project";
import { useAuth } from "hooks/auth";
import useLocalChatHistory from "hooks/localChatHistory";
import { IAction, actionState } from "state/action";

const Chat = () => {
  const { user, accessToken, isAuthenticated, isLoading } = useAuth();
  const [askUser, setAskUser] = useRecoilState(askUserState);
  const userEnv = useRecoilValue(userEnvState);
  const [messages, setMessages] = useRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);
  const [documents, setDocuments] = useRecoilState(documentsState);
  const [actions, setActions] = useRecoilState(actionState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const [socketError, setSocketError] = useState(false);
  const [pSettings, setPSettings] = useRecoilState(projectSettingsState);
  const clearChat = useClearChat();
  const { persistChatLocally } = useLocalChatHistory();

  useEffect(() => {
    if (isLoading || (isAuthenticated && !accessToken)) return;

    if (window.socket) {
      return;
    }

    window.socket = io(server, {
      extraHeaders: {
        Authorization: accessToken || "",
        "user-env": JSON.stringify(userEnv),
      },
    });

    window.socket.on("connect", () => {
      console.log("connected");
      setSocketError(false);
    });

    window.socket.on("connect_error", (err) => {
      console.error("failed to connect", err);
      setSocketError(true);
    });

    window.socket.on("task_start", (err) => {
      setLoading(true);
    });

    window.socket.on("task_end", (err) => {
      setLoading(false);
    });

    window.socket.on("reload", (err) => {
      clearChat();
      getProjectSettings().then((res) => setPSettings(res));
    });

    window.socket.on("message", (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    window.socket.on("stream_start", (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    window.socket.on("stream_token", (token: string) => {
      setMessages((oldMessages) => {
        const lastMessage = { ...oldMessages[oldMessages.length - 1] };
        lastMessage.content += token;
        return [...oldMessages.slice(0, -1), lastMessage];
      });
    });

    window.socket.on("stream_end", (message: IMessage) => {
      setMessages((oldMessages) => [...oldMessages.slice(0, -1), message]);
    });

    window.socket.on("ask", ({ msg, spec }, callback) => {
      setAskUser({ spec, callback });
      setMessages((oldMessages) => [...oldMessages, msg]);
      setLoading(false);
    });

    window.socket.on("ask_timeout", () => {
      setAskUser(undefined);
      setLoading(false);
    });

    window.socket.on("document", (document: IDocument) => {
      setDocuments((old) => ({
        ...old,
        ...{ [document.name]: document },
      }));
    });

    window.socket.on("action", (action: IAction) => {
      setActions((old) => ({
        ...old,
        ...{ [action.name]: action },
      }));
    });

    window.socket.on("token_usage", (count: number) => {
      setTokenCount((old) => old + count);
    });
  }, [userEnv, accessToken, isAuthenticated, isLoading]);

  const onSubmit = async (msg: string) => {
    const message: IMessage = {
      author: user?.name || "User",
      authorIsUser: true,
      content: msg,
      createdAt: Date.now(),
    };

    if (!isAuthenticated || !pSettings?.projectId) {
      persistChatLocally(msg);
    }

    setMessages((oldMessages) => [...oldMessages, message]);
    try {
      await postMessage(message.author, msg);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const onReply = async (msg: string) => {
    if (!askUser) return;
    const message = {
      author: user?.name || "User",
      authorIsUser: true,
      content: msg,
      createdAt: Date.now(),
    };

    askUser.callback({ author: message.author, content: message.content });

    setMessages((oldMessages) => [...oldMessages, message]);
    setAskUser(undefined);
  };

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />
      <Box flexGrow={1} display="flex" flexDirection="column" overflow="scroll">
        {socketError && (
          <Alert severity="error">Could not reach the server.</Alert>
        )}
        <ChatTopBar />
        <MessageContainer
          actions={actions}
          documents={documents}
          messages={messages}
        />
        <InputBox onReply={onReply} onSubmit={onSubmit} />
      </Box>
      <DocumentSideView />
    </Box>
  );
};

export default Chat;
