import { Box, Grid, Link, Typography } from "@mui/material";
import { useRecoilValue } from "recoil";
import { agentState, projectSettingsState } from "state/chat";
import AgentTile from "./agentTile";
import { LogoFull } from "components/logo";
import { ReactMarkdown } from "react-markdown/lib/react-markdown";

const Home = () => {
  const pSettings = useRecoilValue(projectSettingsState);

  let agentGrid = null;

  // if (agents) {
  //   agentGrid = (
  //     <Box flexGrow={1} overflow="scroll">
  //       <Typography
  //         my={5}
  //         fontSize="18px"
  //         fontWeight={700}
  //         color="text.primary"
  //       >
  //         Available tools
  //       </Typography>
  //       <Grid container spacing={3}>
  //         {agents.map((agent) => (
  //           <Grid sm={12} md={6} item key={agent.id}>
  //             <AgentTile agent={agent} />
  //           </Grid>
  //         ))}
  //       </Grid>
  //     </Box>
  //   );
  // } else {
  //   agentGrid = <LogoFull />;
  // }

  return (
    <Box
      flexGrow={1}
      sx={{
        maxWidth: "55rem",
        maxHeight: "100%",
        overflowY: "scroll",
        width: "100%",
        m: "auto",
        color: "text.primary",
        lineHeight: "25px",
        fontSize: "1rem",
        fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Helvetica,Arial,sans-serif,Apple Color Emoji,Segoe UI Emoji",
        display: pSettings?.chainlitMd ? "block" : "flex",
      }}
    >
      {pSettings?.chainlitMd ? (
        <ReactMarkdown
        components={{
          a({node, className, children, ...props}) {
            return <Link {...props} target="_blank" >{children}</Link>
          }
        }}
        >{pSettings?.chainlitMd}</ReactMarkdown>
      ) : (
        <LogoFull />
      )}
    </Box>
  );
};

export default Home;
