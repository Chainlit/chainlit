import { Theme } from "@mui/material";

const border = (theme: Theme) => `1px solid ${theme.palette.divider}`;
const boxShadow = "0 0 transparent, 0 0 transparent,0 0 10px rgba(0,0,0,.1)";
const fontFamily = "Inter"
const fontSize = "16px"

export const inputStyle = (theme: Theme) => ({
  control: {
    display: "flex",
    height: "50px",
    backgroundColor: theme.palette.background.paper,
    borderRadius: ".375rem",
    border,
    fontSize: "16px",
  },
  "&multiLine": {
    control: {
      fontFamily: "monospace",
      minHeight: 63,
    },
    highlighter: {
      padding: 9,
      border: "1px solid transparent",
    },
    input: {
      padding: 9,
      border: "1px solid silver",
    },
  },
  "&singleLine": {
    highlighter: {
      border: "none",
      padding: "0 16px",
      display: "flex",
      margin: "auto",
      fontFamily,
      fontSize,
      height: "28px",
    },
    input: {
      color: theme.palette.text.primary,
      fontFamily,
      fontSize,
      border: "none",
      outline: "none",
      height: "100%",
      top: 0,
      left: 1,
      padding: "0 16px",
    },
  },
  suggestions: {
    maxHeight: "60vh",
    overflow: "scroll",
    backgroundColor: theme.palette.background.default,
    border,
    boxShadow,
    borderRadius: ".375rem",
    list: {},
    item: {
      "&focused": {
        backgroundColor: theme.palette.background.paper,
      },
    },
  },
});

export const mentionStyle = (theme: Theme) => ({
  backgroundColor: theme.palette.primary.light,
  // color: theme.palette.primary.contrastText,
  opacity: 1,
  borderRadius: 3,
  // marginLeft: "-3px",
  // padding: "3px 1px",
  fontFamily: "Inter",
});
