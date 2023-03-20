import { Box, Grid, Stack, Typography } from "@mui/material";
import { useRecoilValue } from "recoil";
import { agentState } from "state/chat";
import AgentTile from "./agentTile";
import VerticalLogo from "assets/vertical_logo.svg";

const Home = () => {
  const agents = useRecoilValue(agentState);

  let agentGrid = null;

  if (agents) {
    agentGrid = (
      <Box flexGrow={1} overflow="scroll">
        <Typography
          my={5}
          fontSize="18px"
          fontWeight={700}
          color="text.primary"
        >
          Available tools
        </Typography>
        <Grid container spacing={3}>
          {agents.map((agent) => (
            <Grid sm={12} md={6} item key={agent.id}>
              <AgentTile agent={agent} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  } else {
    agentGrid = <img style={{ width: "50%", margin: "auto", opacity: .9 }} src={VerticalLogo} />;
  }

  return (
    <Box
      display="flex"
      flexGrow={1}
      sx={{
        maxHeight: "100%",
        overflowY: "scroll",
        maxWidth: "48rem",
        width: "100%",
        m: "auto",
      }}
    >
      {agentGrid}
    </Box>
  );
};

export default Home;
