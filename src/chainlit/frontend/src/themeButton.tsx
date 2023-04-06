import { DarkModeOutlined, LightModeOutlined } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { useRecoilState } from "recoil";
import { themeState } from "state/theme";

export default function ThemeButton() {
  const [themeVariant, setThemeVariant] = useRecoilState(themeState);

  return (
    <IconButton
      onClick={() => {
        const variant = themeVariant === "light" ? "dark" : "light";
        localStorage.setItem("themeVariant", variant);
        setThemeVariant(variant);
      }}
    >
      {themeVariant === "light" ? <DarkModeOutlined /> : <LightModeOutlined />}
    </IconButton>
  );
}
