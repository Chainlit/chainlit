import { Stack } from '@mui/material';

import { useAudio } from '@chainlit/react-client';

import AudioPresence from 'components/organisms/chat/inputBox/AudioPresence';
import WaterMark from 'components/organisms/chat/inputBox/waterMark';

export default function InputBoxFooter() {
  const { audioConnection } = useAudio();

  return (
    <Stack mx="auto" className="watermark">
      {audioConnection === 'on' ? (
        <AudioPresence
          type="client"
          height={18}
          width={36}
          barCount={4}
          barSpacing={2}
        />
      ) : (
        <WaterMark />
      )}
    </Stack>
  );
}
