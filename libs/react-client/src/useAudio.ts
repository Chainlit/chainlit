import { useCallback, useRef, useState } from 'react';

import { IAudioConfig, IFileRef } from './types';
import { useChatInteract } from './useChatInteract';

const defaultConfig: IAudioConfig = {
  enabled: true,
  min_decibels: -45,
  initial_silence_timeout: 3000,
  silence_timeout: 1500,
  max_duration: 15000,
  chunk_duration: 1000
};

const useAudio = (config = defaultConfig) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const cancelling = useRef(false);
  const { sendAudioChunk, endAudioStream } = useChatInteract();
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | undefined>(undefined);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isRecordingFinished, setIsRecordingFinished] = useState(false);

  const cancelRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) {
      return;
    }
    cancelling.current = true;
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  const stopRecording = useCallback(() => {
    if (!isRecording || !mediaRecorderRef.current) {
      return;
    }
    mediaRecorderRef.current.stop();
  }, [isRecording]);

  const startRecording = useCallback(
    (fileReferences?: IFileRef[]) => {
      if (isRecording || !config) {
        return;
      }
      setIsRecordingFinished(false);
      setError(undefined);
      clearTimeout(timer);
      cancelling.current = false;

      const {
        min_decibels,
        silence_timeout,
        initial_silence_timeout,
        chunk_duration,
        max_duration
      } = config;

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          let spokeAtLeastOnce = false;
          let isSpeaking = false;
          let isFirstChunk = true;
          let audioBuffer: Blob | null = null;
          let startTime = Date.now();

          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
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

            if (spokeAtLeastOnce && !cancelling.current) {
              setIsRecordingFinished(true);
              await endAudioStream(fileReferences);
            }
          });

          const audioContext = new AudioContext();
          const audioStreamSource =
            audioContext.createMediaStreamSource(stream);
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
          detectSound();

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
          setError(err.message);
        });
    },
    [timer, isRecording, config, sendAudioChunk, endAudioStream]
  );

  return {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    isSpeaking,
    isRecordingFinished,
    error
  };
};

export { useAudio };
