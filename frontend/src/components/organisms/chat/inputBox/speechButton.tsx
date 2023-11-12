import { useEffect, useState } from 'react';
import SpeechRecognition, {
  useSpeechRecognition
} from 'react-speech-recognition';

import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import { IconButton, Tooltip } from '@mui/material';

interface Props {
  onSpeech: (text: string) => void;
  language?: string;
  disabled?: boolean;
}

const SpeechButton = ({ onSpeech, language, disabled }: Props) => {
  const { transcript, browserSupportsSpeechRecognition } =
    useSpeechRecognition();
  const [isRecording, setIsRecording] = useState(false);
  const [lastTranscript, setLastTranscript] = useState('');
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (lastTranscript.length < transcript.length) {
      onSpeech(transcript.slice(lastTranscript.length));
    }
    setLastTranscript(transcript);
  }, [transcript]);

  useEffect(() => {
    if (isRecording) {
      if (timer) {
        clearTimeout(timer);
      }
      setTimer(
        setTimeout(() => {
          setIsRecording(false);
          SpeechRecognition.stopListening();
        }, 2000) // stop after 3 seconds of silence
      );
    }
  }, [transcript, isRecording]);

  if (!browserSupportsSpeechRecognition) {
    return null;
  }

  return isRecording ? (
    <Tooltip title="Stop recording">
      <span>
        <IconButton
          disabled={disabled}
          color="inherit"
          onClick={() => {
            setIsRecording(false);
            SpeechRecognition.stopListening();
          }}
        >
          <StopCircleIcon />
        </IconButton>
      </span>
    </Tooltip>
  ) : (
    <Tooltip title="Start recording">
      <span>
        <IconButton
          disabled={disabled}
          color="inherit"
          onClick={() => {
            setIsRecording(true);
            SpeechRecognition.startListening({
              continuous: true,
              language: language
            });
          }}
        >
          <KeyboardVoiceIcon />
        </IconButton>
      </span>
    </Tooltip>
  );
};
export default SpeechButton;
