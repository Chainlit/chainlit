import { Box, Stack } from "@mui/material";
import ClearChatButton from "./newChatButton";
import StopButton from "components/chat/stopButton";

const ChatTopBar = () => {
  return (
    <Box px={3} display="flex" alignItems="center" minHeight="60px">
      <Stack ml="auto" direction="row" spacing={1}>
      <StopButton />
        <ClearChatButton />
      </Stack>
    </Box>
  );
};

export default ChatTopBar;
