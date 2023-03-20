import { useLocation, Link } from "react-router-dom";
import { Box, Button, Icon, ListItem, useTheme } from "@mui/material";

interface Props {
  to: string;
  Icon: any;
  title: string;
  disabled?: boolean;
}

const NavItem = (props: Props) => {
  const { to, Icon, title, disabled, ...others } = props;
  const location = useLocation();
  const theme = useTheme();
  const active = to ? location.pathname === to : false;

  const activeBgColor =
    theme.palette.mode === "dark" ? "rgb(19, 47, 76)" : "#f0f7ff";
  const activeColor =
    theme.palette.mode === "dark"
      ? theme.palette.primary.light
      : theme.palette.primary.dark;

  return (
    <ListItem
      component={Link}
      to={to}
      disableGutters
      sx={{
        mb: "1px",
        display: "flex",
        paddingTop: "3px",
        paddingBottom: "3px",
        borderRadius: "5px",
        px: 1,
        width: "96%",
        color: active ? activeColor : theme.palette.text.primary,
        backgroundColor: active ? activeBgColor : "",
        "&:hover": {
          backgroundColor: "rgba(125, 125, 125, 0.1)",
        },
      }}
      {...others}
    >
      <Button
        startIcon={
          active ? (
            <Icon fontSize="small" sx={{ mr: 1 }} color="inherit" />
          ) : (
            <Icon fontSize="small" sx={{ mr: 1 }} />
          )
        }
        disableRipple
        disabled={disabled}
        sx={{
          justifyContent: "flex-start",
          textAlign: "left",
          textTransform: "none",
          borderRadius: 0,
          color: "inherit",
          "&:hover": {
            backgroundColor: "transparent",
          },
        }}
      >
        <Box
          sx={{
            fontSize: "0.875rem",
          }}
        >
          {title}
        </Box>
      </Button>
    </ListItem>
  );
};

export default NavItem;
