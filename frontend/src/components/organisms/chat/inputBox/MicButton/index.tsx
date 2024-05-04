import { useEffect, useRef, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { Translator } from 'components/i18n';

import { projectSettingsState } from 'state/project';

import { useChatInteract } from 'client-types/*';

import RecordScreen from './RecordScreen';

interface Props {
  disabled?: boolean;
}

const MicButton = ({ disabled }: Props) => {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);
  const isRecordingRef = useRef(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { sendAudioChunk, endAudioStream } = useChatInteract();
  const pSettings = useRecoilValue(projectSettingsState);

  useHotkeys('p', () => {
    if (!isRecording && !disabled) {
      isRecordingRef.current = true;
      setIsRecording(true);
    }
  });

  useEffect(() => {
    if (!isRecording) {
      clearTimeout(timer);
      return;
    }

    if (!pSettings) {
      return;
    }

    const {
      min_decibels,
      silence_timeout,
      initial_silence_timeout,
      sample_rate,
      chunk_duration
    } = pSettings.features.audio;

    navigator.mediaDevices
      .getUserMedia({ audio: { sampleRate: sample_rate } })
      .then((stream) => {
        let spokeAtLeastOnce = false;
        let isSpeaking = false;
        let isFirstChunk = true;

        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener('dataavailable', async (event) => {
          if (!spokeAtLeastOnce) {
            return;
          }
          setIsSpeaking(isSpeaking);
          sendAudioChunk(isFirstChunk, mediaRecorder.mimeType, event.data);
          if (isFirstChunk) {
            isFirstChunk = false;
          }
        });

        mediaRecorder.addEventListener('stop', (event) => {
          console.log('MediaRecorder stop:', event);
          isRecordingRef.current = false;

          setIsRecording(false);
          setIsSpeaking(false);

          if (spokeAtLeastOnce) {
            endAudioStream();
          }
        });

        const audioContext = new AudioContext();
        const audioStreamSource = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.minDecibels = min_decibels;
        audioStreamSource.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;

        const domainData = new Uint8Array(bufferLength);

        mediaRecorder.start(chunk_duration);

        const detectSound = () => {
          analyser.getByteFrequencyData(domainData);
          const soundDetected = domainData.some((value) => value > 0);
          if (!isSpeaking) {
            isSpeaking = soundDetected;
          }
          if (!spokeAtLeastOnce && soundDetected) {
            setIsSpeaking(isSpeaking);
            spokeAtLeastOnce = true;
          }
          requestAnimationFrame(detectSound);
        };
        requestAnimationFrame(detectSound);

        setTimeout(() => {
          if (!spokeAtLeastOnce) {
            mediaRecorder.stop();
            stream.getTracks().forEach((track) => track.stop());
          } else {
            setTimer(
              setInterval(() => {
                if (!isSpeaking) {
                  mediaRecorder.stop();
                  stream.getTracks().forEach((track) => track.stop());
                } else {
                  isSpeaking = false;
                }
              }, silence_timeout)
            );
          }
        }, initial_silence_timeout);
      })
      .catch((err) => {
        toast.error('Failed to start recording: ' + err.message);
      });
  }, [isRecording]);

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!pSettings?.features.audio.enabled) {
    return null;
  }

  return (
    <>
      <RecordScreen open={isRecording} isSpeaking={isSpeaking} />
      <Tooltip
        title={
          <Translator
            path="components.organisms.chat.inputBox.speechButton.start"
            suffix=" (P)"
          />
        }
      >
        <span>
          <IconButton
            disabled={disabled || isRecording}
            color="inherit"
            size={size}
            onClick={() => {
              isRecordingRef.current = true;
              setIsRecording(true);
            }}
          >
            <KeyboardVoiceIcon fontSize={size} />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
export default MicButton;
