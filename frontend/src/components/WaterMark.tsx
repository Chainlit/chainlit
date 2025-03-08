import { Translator } from 'components/i18n';

import 'assets/logo_dark.svg';
import LogoDark from 'assets/logo_dark.svg?react';
import 'assets/logo_light.svg';
import LogoLight from 'assets/logo_light.svg?react';

import { useTheme } from './ThemeProvider';

export default function WaterMark() {
  const { variant } = useTheme();
  const Logo = variant === 'light' ? LogoLight : LogoDark;

  return (
    <a
      href="https://chainlit.io"
      target="_blank"
      className="watermark"
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none'
      }}
    >
      <div className="text-xs text-muted-foreground">
        <Translator path="chat.watermark" />
      </div>
      <Logo
        style={{
          width: 65,
          height: 'auto',
          filter: 'grayscale(1)',
          marginLeft: '4px'
        }}
      />
    </a>
  );
}
