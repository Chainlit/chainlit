import { Typography } from "@mui/material";

interface Props {
  timestamp: number;
}

export default function MessageTime({ timestamp }: Props) {
  if (!timestamp) return null;
  const dateOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  };
  const date = new Date(timestamp).toLocaleTimeString(undefined, dateOptions);
  return (
    <Typography lineHeight={1} color="text.secondary" variant="overline">
      {date}
    </Typography>
  );
}
