import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import Messages from "./messages";
import Input from "./input";
import { socket } from "api";
import { useRecoilValue, useSetRecoilState } from "recoil";
import {
  IMessage,
  loadingState,
  messagesState,
  tokenCountState,
} from "state/chat";
import Loading from "./loading";
import { Stack } from "@mui/system";
import Playground from "components/playground";
import DocumentSideView from "components/document/sideView";
import ChatTopBar from "./topBar";

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
  const tokenCount = useRecoilValue(tokenCountState);
  const setMessages = useSetRecoilState(messagesState);
  const setLoading = useSetRecoilState(loadingState);

  const onSubmit = (msg: string) => {
    msg = clean(msg, agentRegexp, "@");

    const message: IMessage = {
      author: "User",
      content: msg,
    };
    setMessages((oldMessages) => [...oldMessages, message]);
    setLoading(true);
    socket.emit("message", { data: msg });
  };

  const inputBox = (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        pt: 2,
        boxSizing: "border-box",
        width: "100%",
        minHeight: "100px",
        maxWidth: "48rem",
        m: "auto",
        justifyContent: "center",
      }}
    >
      <Input onSubmit={onSubmit} />
      <Stack flexDirection="row" alignItems="center">
        <Typography
          sx={{ ml: "auto" }}
          color="text.secondary"
          variant="caption"
        >
          Token count: {tokenCount}
        </Typography>
      </Stack>
    </Box>
  );

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />
      <Box flexGrow={1} display="flex" flexDirection="column" overflow="scroll">
        <Loading />
        <ChatTopBar />
        <Messages />
        {inputBox}
      </Box>
      <DocumentSideView />
    </Box>
  );
};

export default Chat;
