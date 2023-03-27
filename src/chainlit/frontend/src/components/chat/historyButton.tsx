import { History } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { getConversations } from "api";

export default function HistoryButton() {
  const foo = async () => {
    const conversations = await getConversations();
    console.log(conversations);
  };

  return (
    <Tooltip title="Show history">
      <IconButton onClick={foo}>
        <History />
      </IconButton>
    </Tooltip>
  );
}
