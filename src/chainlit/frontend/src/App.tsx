import { Box } from "@mui/material";
import "./App.css";
import Chat from "components/chat/index";
import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { useEffect } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  agentState,
  documentsState,
  debugState,
  IMessage,
  loadingState,
  messagesState,
  tokenCountState,
  IDocument,
} from "state/chat";
import { socket } from "api";
import TopBar from "components/topBar";
import DocumentView from "components/artifact/view";
import theme from "theme";
import { ThemeProvider } from "@mui/material";
import { themeState } from "state/theme";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TopBar />
        <Chat />
      </Box>
    ),
  },
  {
    path: "/document/:name",
    element: (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <TopBar />
        <DocumentView />
      </Box>
    ),
  },
  {
    path: "*",
    element: <Navigate replace to="/" />,
  },
]);

function App() {
  const themeVariant = useRecoilValue(themeState)
  const setMessages = useSetRecoilState(messagesState);
  const setDocuments = useSetRecoilState(documentsState);
  const setTokenCount = useSetRecoilState(tokenCountState);
  const setDebug = useSetRecoilState(debugState);
  const setLoading = useSetRecoilState(loadingState);
  const setAgents = useSetRecoilState(agentState);

  useEffect(() => {
    socket.removeAllListeners();

    socket.on("message", (message: IMessage) => {
      if (message.final || message.error) {
        setLoading(false);
      }
      setMessages((oldMessages) => [...oldMessages, message]);
    });

    socket.on("document", (document: IDocument) => {
      setDocuments((old) => ({
        ...old,
        ...{ [document.spec.name]: document },
      }));
    });

    socket.on("debug", (debug: any) => {
      setDebug((old) => [...old, debug]);
    });

    socket.on("total_tokens", (count: any) => {
      setTokenCount(count);
    });

    socket.on("agents", (agents: any) => {
      setAgents(agents);
    });
  }, []);

  return (
    <ThemeProvider theme={theme(themeVariant)}>
      <Box
        display="flex"
        bgcolor="background.default"
        height="100vh"
        width="100vw"
      >
        <RouterProvider router={router} />
      </Box>
    </ThemeProvider>
  );
}

export default App;
