import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import type { IAudioElement } from 'client-types/';

import { AudioElement } from './Audio';

interface Props {
  items: IAudioElement[];
}

const InlinedAudioList = ({ items }: Props) => {
  return (
    <Stack spacing={1}>
      {items.map((audio, i) => {
        return (
          <Box key={i} pt={0.5}>
            <AudioElement element={audio} />
          </Box>
        );
      })}
    </Stack>
  );
};

export { InlinedAudioList };
