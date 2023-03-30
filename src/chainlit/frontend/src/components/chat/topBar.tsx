import { Box, Stack } from "@mui/material";
import StepsToggle from "components/chat/stepsToggle";
import ClearChatButton from "./clearChatButton";

const ChatTopBar = () => {
  return (
    <Box px={3} display="flex" alignItems="center" minHeight="60px">
      <Stack ml="auto" direction="row" spacing={1}>
        <StepsToggle />
        <ClearChatButton />
      </Stack>
    </Box>
  );
};

export default ChatTopBar;
