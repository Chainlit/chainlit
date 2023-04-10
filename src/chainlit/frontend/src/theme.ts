import { createTheme } from "@mui/material/styles";
import Grey from "@mui/material/colors/grey";

const typography = {
  fontFamily: ["Inter", "sans-serif"].join(","),
};

const components = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      disableRipple: true,
      sx: {
        textTransform: "none",
      },
    },
  },
  MuiTab: {
    defaultProps: {
      disableRipple: true,
      sx: {
        textTransform: "none",
        fontSize: "14px",
      },
    },
  },
};

const success = {
  main: "rgba(25, 195, 125, 1)",
  contrastText: "#fff",
};
const error = {
  main: "rgba(239, 65, 70, 1)",
  contrastText: "#fff",
};

const darkTheme = createTheme({
  typography,
  components,
  palette: {
    mode: "dark",
    success,
    error,
    background: {
      default: "#1D1D22",
      paper: "#23262F",
    },
    primary: {
      main: "#f34971",
      // dark: "#2B64D3",
      // light: "#6BA6F9",
      contrastText: "#fff",
    },
    secondary: {
      main: "#9757D7",
      dark: "#763FB8",
      light: "#B87FE7",
      contrastText: "#fff",
    },

    text: {
      primary: "#F4F5F6",
      secondary: "rgba(255,255,255,0.6)",
    },
  },
});

const lightTheme = createTheme({
  typography,
  components,
  palette: {
    mode: "light",
    success,
    error,
    background: {
      default: "#fff",
      paper: "#ececf1",
    },
    primary: {
      main: "#f34971",
      contrastText: "#fff",
    },
    secondary: {
      main: "#9757D7",
      dark: "#763FB8",
      light: "#B87FE7",
      contrastText: "#fff",
    },
    text: {
      primary: "#202123",
      secondary: "#8e8ea0",
    },
  },
});

const theme = (variant: "dark" | "light") =>
  variant === "dark" ? darkTheme : lightTheme;

export const greyButtonTheme = createTheme({
  components,
  typography,
  palette: {
    primary: {
      main: Grey[300],
      contrastText: "black",
    },
  },
});

export default theme;
