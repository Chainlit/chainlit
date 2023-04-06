import { Button } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { loadingState, projectSettingsState } from "state/chat";

export default function StopButton() {
  const pSettings = useRecoilValue(projectSettingsState);
  const [loading, setLoading] = useRecoilState(loadingState);

  if (!loading || !pSettings?.stoppable) {
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
