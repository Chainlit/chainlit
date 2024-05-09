import { useCallback, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import KeyboardVoiceIcon from '@mui/icons-material/KeyboardVoice';
import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { Translator } from 'components/i18n';

import { attachmentsState } from 'state/chat';
import { projectSettingsState } from 'state/project';

import { askUserState, useChatInteract } from 'client-types/*';

import RecordScreen from './RecordScreen';

interface Props {
  disabled?: boolean;
}

const MicButton = ({ disabled }: Props) => {
  const askUser = useRecoilValue(askUserState);
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { sendAudioChunk, endAudioStream } = useChatInteract();
  const pSettings = useRecoilValue(projectSettingsState);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);

  disabled = disabled || !!askUser;

  const startRecording = useCallback(() => {
    if (isRecording || disabled) {
      return;
    }
    clearTimeout(timer);

    if (!pSettings) {
      return;
    }

    const {
      min_decibels,
      silence_timeout,
      initial_silence_timeout,
      sample_rate,
      chunk_duration,
      max_duration
    } = pSettings.features.audio;

    navigator.mediaDevices
      .getUserMedia({ audio: { sampleRate: sample_rate } })
      .then((stream) => {
        let spokeAtLeastOnce = false;
        let isSpeaking = false;
        let isFirstChunk = true;
        let audioBuffer: Blob | null = null;
        let startTime = Date.now();

        const mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.addEventListener('start', () => {
          setIsRecording(true);
          startTime = Date.now();
        });

        mediaRecorder.addEventListener('dataavailable', async (event) => {
          if (!spokeAtLeastOnce) {
            if (!audioBuffer) {
              audioBuffer = new Blob([event.data], { type: event.data.type });
            } else {
              audioBuffer = new Blob([audioBuffer, event.data], {
                type: event.data.type
              });
            }
          }
          if (mediaRecorder.state === 'inactive') {
            return;
          }
          const elapsedTime = Date.now() - startTime;
          if (elapsedTime >= max_duration) {
            mediaRecorder.stop();
            stream.getTracks().forEach((track) => track.stop());
            return;
          }

          setIsSpeaking(isSpeaking);
          const [mimeType, _] = mediaRecorder.mimeType.split(';');

          if (audioBuffer) {
            // If there is buffered data and the user has spoken, send the buffered data first
            await sendAudioChunk(
              isFirstChunk,
              mimeType,
              elapsedTime,
              new Blob([audioBuffer, event.data])
            );
            audioBuffer = null; // Clear the buffer
          } else {
            await sendAudioChunk(
              isFirstChunk,
              mimeType,
              elapsedTime,
              event.data
            );
          }

          if (isFirstChunk) {
            isFirstChunk = false;
          }
        });

        mediaRecorder.addEventListener('stop', async () => {
          setIsRecording(false);
          setIsSpeaking(false);
          if (spokeAtLeastOnce) {
            const fileReferences = attachments
              ?.filter((a) => !!a.serverId)
              .map((a) => ({ id: a.serverId! }));
            await endAudioStream(fileReferences);
            setAttachments([]);
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
          if (mediaRecorder.state === 'inactive') {
            return;
          }
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
  }, [pSettings, timer, isRecording, disabled, attachments]);

  useHotkeys('p', startRecording);

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
            onClick={startRecording}
          >
            <KeyboardVoiceIcon fontSize={size} />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
export default MicButton;
