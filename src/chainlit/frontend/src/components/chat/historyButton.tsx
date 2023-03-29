import { History } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { useRecoilValue } from "recoil";
import { projectSettingsState } from "state/chat";
// import { getConversations } from "api";

export default function HistoryButton() {
  const pSettings = useRecoilValue(projectSettingsState);

  if (!pSettings?.projectId) {
    return null;
  }
  
  return (
    <Tooltip title="Show history">
      <IconButton>
        <History />
      </IconButton>
    </Tooltip>
  );
}
