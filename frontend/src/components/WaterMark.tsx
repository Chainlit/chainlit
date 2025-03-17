import { Translator } from 'components/i18n';

import LogoDark from 'assets/logo_dark.svg?react';
import LogoLight from 'assets/logo_light.svg?react';

import { useTheme } from './ThemeProvider';

export default function WaterMark() {
  const { variant } = useTheme();
  const Logo = variant === 'light' ? LogoLight : LogoDark;

  return (
    <a
      href="https://one.penguin-international.com/"
      target="_blank"
      className="watermark"
      style={{
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        gap: '8px' // Add spacing between logo and text
      }}
    >
      <Logo width={24} height={24} /> {/* Ensure logo is displayed */}
      <div className="text-xs text-muted-foreground">
        <p>Powered by PenguinOne ♥️</p>
      </div>
    </a>
  );
}
