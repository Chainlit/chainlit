import { OpenInNew } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";

interface Props {}

export default function OpenConversationButton({}: Props) {
  return (
    <Tooltip title="Open conversation">
      <span>
        <IconButton color="primary">
          <OpenInNew />
        </IconButton>
      </span>
    </Tooltip>
  );
}
