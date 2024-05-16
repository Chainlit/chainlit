import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { Backdrop, Stack, Typography } from '@mui/material';

import { Translator } from 'components/i18n';

export default function DropScreen() {
  return (
    <Backdrop
      open
      sx={{
        zIndex: 10
      }}
    >
      <Stack alignItems="center" gap={2} color="grey.400">
        <InsertDriveFileIcon sx={{ width: '100px', height: '100px' }} />
        <Typography fontWeight={700} fontSize="1.5rem">
          <Translator path="components.organisms.chat.dropScreen.dropYourFilesHere" />
        </Typography>
      </Stack>
    </Backdrop>
  );
}
