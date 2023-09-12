import { Box, Stack } from '@mui/material';

import { IAudioElement } from 'src/types/element';

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
