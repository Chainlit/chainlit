import { useRecoilValue } from 'recoil';

import { useContext } from 'react';

import { Stack, Typography, Box, Link } from '@mui/material';

import { Translator } from 'components/i18n';

// import 'assets/evoya_light.svg';
import LogoDark from 'assets/evoya_light.svg?react';
// import 'assets/evoya_light.svg';
import LogoLight from 'assets/evoya_light.svg?react';

import { settingsState } from 'state/settings';

import { WidgetContext } from '@chainlit/copilot/src/context';

export default function WaterMark() {
  const { evoya } = useContext(WidgetContext);
  const { theme } = useRecoilValue(settingsState);
  const Logo = theme === 'light' ? LogoLight : LogoDark;

  return (
    <Stack gap={1}>
      {!evoya?.hideWaterMark && (
        <Stack alignItems="center" className="watermark">
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
              <span>Evoya AI</span>
            </Typography>
          </a>
        </Stack>
      )}
      {evoya?.additionalInfo && (
        <Box textAlign="center" lineHeight={1.25}>
          <Typography variant="caption" color="text.secondary" letterSpacing="initial">
            {evoya?.additionalInfo?.text ? evoya?.additionalInfo?.text : <Translator path="components.organisms.chat.inputBox.additionalInfo.text" />}
            {evoya?.additionalInfo?.link && (
              <Link href={evoya?.additionalInfo?.link} variant="inherit" underline="hover" fontWeight={400} marginLeft={1}>{evoya?.additionalInfo?.linkText}</Link>
            )}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
