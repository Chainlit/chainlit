import { Box } from "@mui/material";
import ReactJson from "react-json-view";
import { useRecoilValue } from "recoil";
import { debugState } from "state/chat";

const Debug = () => {
  const debug = useRecoilValue(debugState);
  return (
    <Box
      display="flex"
      boxSizing="border-box"
      flexDirection="column"
      flexGrow={1}
      p={3}
      width="100%"
      sx={{
        maxHeight: "100%",
        overflow: "scroll",
      }}
    >
      <ReactJson style={{
        padding: "16px",
        borderRadius: "0.3rem",
      }} collapsed theme="monokai" src={debug} />
    </Box>
  );
};

export default Debug;
