import { Stack } from "@mui/material";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import { Logo } from "components/logo";
import AgentAvatar from "./chat/agentAvatar";
import StepsToggle from "./chat/stepsToggle";
import { Link, useLocation } from "react-router-dom";

function Nav() {
  const location = useLocation();

  const tabs = [
    { to: "/", label: "Chat" },
    { to: "/documents", label: "Documents" },
  ];

  const value = tabs.findIndex((t) => location.pathname === t.to);

  return (
    <Tabs
      value={value}
      indicatorColor="primary"
      TabIndicatorProps={{ sx: { display: "none" } }}
    >
      {tabs.map((t, i) => (
        <Tab component={Link} to={t.to} key={i} value={i} label={t.label} />
      ))}
    </Tabs>
  );
}

export default function TopBar() {
  return (
    <AppBar elevation={0} color="transparent" position="static">
      <Toolbar
        sx={{
          height: "60px",
          borderBottomWidth: "1px",
          borderBottomStyle: "solid",
          borderBottomColor: (theme) => theme.palette.divider,
        }}
      >
        <Stack alignItems="center" direction="row">
          <Logo />
          <Nav />
        </Stack>
        <Stack
          alignItems="center"
          sx={{ ml: "auto" }}
          direction="row"
          spacing={1}
        >
          <StepsToggle />
          <AgentAvatar agent="User" />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
