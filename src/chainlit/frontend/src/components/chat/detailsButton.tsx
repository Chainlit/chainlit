import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { INestedMessage } from "state/chat";
import { Button, CircularProgress } from "@mui/material";

interface Props {
  message: INestedMessage;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

export default function DetailsButton({
  message,
  opened,
  onClick,
  loading,
}: Props) {
  const tool = message.subMessages?.length
    ? message.subMessages[0].author
    : undefined;

  if (!loading && !tool) {
    return null;
  }

  const text = loading ? (tool ? `Using ${tool}` : "Running") : `Used ${tool}`;

  let id = undefined;
  if (tool) {
    id = tool.toLowerCase();
    if (loading) {
      id += "-loading";
    } else {
      id += "-done";
    }
  }

  return (
    <Button
      id={id}
      color={loading ? "success" : "primary"}
      startIcon={
        loading ? <CircularProgress color="inherit" size={18} /> : undefined
      }
      size="large"
      variant="outlined"
      endIcon={
        tool ? opened ? <ExpandLessIcon /> : <ExpandMoreIcon /> : undefined
      }
      onClick={tool ? onClick : undefined}
    >
      {text}
    </Button>
  );
}
