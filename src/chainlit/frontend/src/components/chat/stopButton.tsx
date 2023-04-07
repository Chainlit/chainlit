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
      sx={{
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        position: "fixed",
        zIndex: 10,
      }}
    >
      Stop
    </Button>
  );
}
