import { Button } from "@mui/material";
import { useRecoilState } from "recoil";
import { loadingState } from "state/chat";

export default function StopButton() {
  const [loading, setLoading] = useRecoilState(loadingState);

  if (!loading) {
    return null;
  }

  const handleClick = () => {
    setLoading(false);
    window.socket?.emit("stop");
  };

  return (
    <Button
      color="error"
      variant="contained"
      onClick={handleClick}
    >
      Stop
    </Button>
  );
}
