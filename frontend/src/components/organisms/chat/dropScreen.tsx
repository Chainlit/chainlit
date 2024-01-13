import { Backdrop, Stack, Typography } from '@mui/material';

import { Translator } from 'components/i18n';

import FileIcon from 'assets/file';

export default function DropScreen() {
  return (
    <Backdrop
      open
      sx={{
        zIndex: 10
      }}
    >
      <Stack alignItems="center" gap={2}>
        <FileIcon sx={{ width: '100px', height: '100px' }} />
        <Typography color="text.secondary" fontWeight={700} fontSize="1.5rem">
          <Translator path="components.organisms.chat.dropScreen.dropYourFilesHere" />
        </Typography>
      </Stack>
    </Backdrop>
  );
}
