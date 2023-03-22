import { atom } from "recoil";

const defaultTheme =
  window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";

export const themeState = atom<"dark" | "light">({
  key: "Theme",
  default: defaultTheme,
});
