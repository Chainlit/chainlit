import { Stack, Typography } from '@mui/material';

import { Translator } from 'components/i18n';

export default function WaterMark() {
  return (
    <Stack mx="auto" className="watermark">
        <Typography fontSize="12px" color="text.secondary">
          <Translator path="components.organisms.chat.inputBox.waterMark.text" />
        </Typography>
    </Stack>
  );
}