import { Stack, Typography } from "@mui/material";
import { IAgent } from "state/chat";
import AgentAvatar from "./agentAvatar";

interface Props {
  agent: IAgent;
}

const AgentTile = ({ agent }: Props) => {
  return (
    <Stack
      gap={1}
      pb={2}
      alignItems="center"
      width="100%"
      sx={{
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        borderBottomColor: (theme) => theme.palette.divider,
      }}
    >
      <AgentAvatar agent={agent.id} />
      <Typography fontSize="1.125rem" color="text.primary">
        {agent.display}
      </Typography>
      <Typography
        textAlign="center"
        color="text.secondary"
        sx={{
          minHeight: "48px",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "-webkit-box",
          WebkitLineClamp: "2",
          WebkitBoxOrient: "vertical",
          width: "100%",
        }}
      >
        {agent.description}
      </Typography>
    </Stack>
  );
};

export default AgentTile;
