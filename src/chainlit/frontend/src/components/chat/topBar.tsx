import { History } from "@mui/icons-material";
import { Box, IconButton, Stack, Tooltip } from "@mui/material";
import StepsToggle from "components/chat/stepsToggle";
import ClearChatButton from "./clearChatButton";

const ChatTopBar = () => {
  return (
    <Box px={3} display="flex" alignItems="center" minHeight="60px">
      <Stack ml="auto" direction="row" spacing={1}>
        <StepsToggle />
        <Tooltip title="Show history">
          <IconButton>
            <History />
          </IconButton>
        </Tooltip>
        <ClearChatButton />
      </Stack>
    </Box>
  );
};

export default ChatTopBar;
