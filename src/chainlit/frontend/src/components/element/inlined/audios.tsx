import { Stack } from '@mui/material';
import AudioElement from 'components/element/audio';
import { IAudioElement } from 'state/element';

interface Props {
  items: IAudioElement[];
}

export default function InlinedAudioList({ items }: Props) {
  return (
    <Stack spacing={1}>
      {items.map((audio, i) => {
        return (
          <div key={i}>
            <AudioElement element={audio} />
          </div>
        );
      })}
    </Stack>
  );
}
