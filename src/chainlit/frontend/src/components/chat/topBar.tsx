import { Box, Stack } from "@mui/material";
import ClearChatButton from "./newChatButton";

const ChatTopBar = () => {
  return (
    <Box px={3} display="flex" alignItems="center" minHeight="60px">
      <Stack ml="auto" direction="row" spacing={1}>
        <ClearChatButton />
      </Stack>
    </Box>
  );
};

export default ChatTopBar;
