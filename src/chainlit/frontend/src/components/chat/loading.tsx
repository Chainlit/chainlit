import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import { useRecoilValue } from "recoil";
import { loadingState } from "state/chat";

export default function Loading() {
  const loading = useRecoilValue(loadingState);
  if (!loading) {
    return null;
  }
  return (
    <Box sx={{ width: "100%" }}>
      <LinearProgress id="chat-loading" />
    </Box>
  );
}
