import { useRecoilValue } from "recoil";
import { themeState } from "state/theme";
import LogoBlack from "assets/logo_black.svg";
import LogoWhite from "assets/logo_white.svg";
import LogoFullBlack from "assets/logo_full_black.svg";
import LogoFullWhite from "assets/logo_full_white.svg";

export const Logo = () => {
  const themeVariant = useRecoilValue(themeState);
  const src = themeVariant === "light" ? LogoBlack : LogoWhite;
  return <img src={src} width={40} />;
};