import { OpenInNew } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import { Link } from "react-router-dom";

interface Props {
  conversationId: string;
}

export default function OpenConversationButton({ conversationId }: Props) {
  return (
    // <Tooltip title="Open conversation">
    //   <span>
    <IconButton
      component={Link}
      to={`/conversations/${conversationId}`}
      size="small"
      color="primary"
    >
      <OpenInNew />
    </IconButton>
    //   </span>
    // </Tooltip>
  );
}
