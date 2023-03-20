import { Chat, Code, AccountTree } from "@mui/icons-material";
import { Box, Divider, Typography } from "@mui/material";
import NavItem from "components/nav/item";

const SideBar = () => {
  return (
    <Box
      sx={{
        overflow: "scroll",
        width: "300px",
        p: 2,
        // backgroundColor: "background.paper",
        borderRight: "1px rgba(255, 255, 255, 0.12) solid",
        color: "rgba(236,236,241,1)",
      }}
    >
      <NavItem title="Chat" to="/" Icon={Chat} />
      <NavItem title="Debug" to="/debug" Icon={Code} />
      <NavItem title="Workflows" to="/workflows" Icon={AccountTree} />
      {/* <Divider sx={{my: 3}} /> */}
      <Typography mt={2} fontWeight="700" variant="h6">
        Artifacts
      </Typography>
    </Box>
  );
};

export default SideBar;
