import { atom } from "recoil";

const defaultTheme =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

const preferredTheme = localStorage.getItem("themeVariant");

const theme = preferredTheme ? (preferredTheme as any) : defaultTheme;

export const themeState = atom<"dark" | "light">({
  key: "Theme",
  default: theme,
});
