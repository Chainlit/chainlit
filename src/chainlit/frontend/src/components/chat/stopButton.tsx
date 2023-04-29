import { Box, Button } from "@mui/material";
import { useRecoilState, useRecoilValue } from "recoil";
import { loadingState } from "state/chat";
import { projectSettingsState } from "state/project";

export default function StopButton() {
  const [loading, setLoading] = useRecoilState(loadingState);
  const pSettings = useRecoilValue(projectSettingsState)

  if (!loading || pSettings?.hideCot) {
    return null;
  }

  const handleClick = () => {
    setLoading(false);
    window.socket?.emit("stop");
  };

  return (
    <Box margin="auto">
      <Button color="error" variant="outlined" onClick={handleClick}>
        Stop generation
      </Button>
    </Box>
  );
}
