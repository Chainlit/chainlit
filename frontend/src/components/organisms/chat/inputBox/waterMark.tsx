import { useRecoilValue } from 'recoil';

import { Stack, Typography } from '@mui/material';

import { Translator } from 'components/i18n';

import 'assets/evoya_light.svg';
import LogoDark from 'assets/evoya_light.svg?react';
import 'assets/evoya_light.svg';
import LogoLight from 'assets/evoya_light.svg?react';

import { settingsState } from 'state/settings';

export default function WaterMark() {
  const { theme } = useRecoilValue(settingsState);
  const Logo = theme === 'light' ? LogoLight : LogoDark;
  return (
    <Stack mx="auto" className="watermark">
      <a
        href="https://evoya.ai"
        target="_blank"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        <Typography fontSize="12px" color="text.secondary">
          <Translator path="components.organisms.chat.inputBox.waterMark.text" />
        </Typography>
        <Logo
          style={{
            width: 20,
            height: 'auto',
            filter: 'grayscale(1)',
            marginLeft: '10px',
            marginRight: '5px'
          }}
        />
        <Typography fontSize="12px" color="text.secondary">
          <span>Evoya Ai</span>
        </Typography>
      </a>
    </Stack>
  );
}
