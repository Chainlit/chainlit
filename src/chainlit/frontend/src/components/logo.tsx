import { useRecoilValue } from 'recoil';

import LogoDark from 'assets/logo_dark.svg';
import LogoLight from 'assets/logo_light.svg';

import { settingsState } from 'state/settings';

interface Props {
  width?: number;
  style?: React.CSSProperties;
}

export const Logo = ({ width, style }: Props) => {
  const { theme } = useRecoilValue(settingsState);
  const src = theme === 'light' ? LogoLight : LogoDark;
  return <img src={src} style={style} width={width || 40} />;
};
