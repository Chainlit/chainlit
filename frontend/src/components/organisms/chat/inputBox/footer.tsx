import { Stack } from '@mui/material';

import { useAudio } from '@chainlit/react-client';

import AudioWaves from 'components/organisms/chat/inputBox/AudioWaves';
import WaterMark from 'components/organisms/chat/inputBox/waterMark';

export default function InputBoxFooter() {
  const { isRecording } = useAudio();

  return (
    <Stack mx="auto" className="watermark">
      {isRecording ? (
        <AudioWaves height={18} width={36} barCount={4} barSpacing={2} />
      ) : (
        <WaterMark />
      )}
    </Stack>
  );
}
