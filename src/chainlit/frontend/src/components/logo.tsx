import { useRecoilValue } from 'recoil';
import { themeState } from 'state/theme';
import LogoDark from 'assets/logo_dark.svg';
import LogoLight from 'assets/logo_light.svg';

interface Props {
  width?: number;
  style?: React.CSSProperties;
}

export const Logo = ({ width, style }: Props) => {
  const themeVariant = useRecoilValue(themeState);
  const src = themeVariant === 'light' ? LogoLight : LogoDark;
  return <img src={src} style={style} width={width || 40} />;
};
