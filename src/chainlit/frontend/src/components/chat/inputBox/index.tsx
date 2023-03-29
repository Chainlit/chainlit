import { Box, Typography, Stack } from "@mui/material";
import { useRecoilValue } from "recoil";
import { tokenCountState } from "state/chat";
import Input from "./input";

interface Props {
  onSubmit: (message: string) => void;
}

export default function InputBox({ onSubmit }: Props) {
  const tokenCount = useRecoilValue(tokenCountState);

  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={{
        pt: 2,
        boxSizing: "border-box",
        width: "100%",
        minHeight: "100px",
        maxWidth: "55rem",
        m: "auto",
        justifyContent: "center",
      }}
    >
      <Input onSubmit={onSubmit} />
      <Stack flexDirection="row" alignItems="center">
        <Typography
          sx={{ ml: "auto" }}
          color="text.secondary"
          variant="caption"
        >
          Token count: {tokenCount}
        </Typography>
      </Stack>
    </Box>
  );
}
