import { useRecoilValue } from 'recoil';

import { Stack, Typography } from '@mui/material';

import { Logo } from 'components/atoms/logo';

import { projectSettingsState } from 'state/project';

export default function WaterMark() {
  const pSettings = useRecoilValue(projectSettingsState);
  const githubLink =
    pSettings?.ui?.github ?? 'https://github.com/Chainlit/chainlit';
  const watermarkText = pSettings?.ui?.watermark_text ?? 'Built with';
  return (
    <Stack mx="auto">
      <a
        href={githubLink}
        target="_blank"
        style={{
          display: 'flex',
          alignItems: 'center',
          textDecoration: 'none'
        }}
      >
        <Typography fontSize="12px" color="text.secondary">
          {watermarkText}
        </Typography>
        <Logo
          style={{ width: 65, filter: 'grayscale(1)', marginLeft: '4px' }}
        />
      </a>
    </Stack>
  );
}
