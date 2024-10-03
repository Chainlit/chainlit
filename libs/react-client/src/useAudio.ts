import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  isRecordingState,
  wavRecorderState,
  wavStreamPlayerState
} from './state';
import { useChatInteract } from './useChatInteract';

const useAudio = () => {
  const [isRecording, setIsRecording] = useRecoilState(isRecordingState);
  const wavRecorder = useRecoilValue(wavRecorderState);
  const wavStreamPlayer = useRecoilValue(wavStreamPlayerState);

  const { sendAudioChunk, endAudioStream } = useChatInteract();

  const startConversation = useCallback(async () => {
    setIsRecording(true);
    let isFirstChunk = true;
    const startTime = Date.now();
    const mimeType = 'pcm16';
    // Connect to microphone
    await wavRecorder.begin();
    await wavStreamPlayer.connect();
    await wavRecorder.record(async (data) => {
      const elapsedTime = Date.now() - startTime;
      await sendAudioChunk(isFirstChunk, mimeType, elapsedTime, data.mono);
      isFirstChunk = false;
    });
  }, [sendAudioChunk, wavRecorder, wavStreamPlayer]);

  const endConversation = useCallback(async () => {
    setIsRecording(false);

    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
    await endAudioStream();
  }, [endAudioStream, wavRecorder, wavStreamPlayer]);

  return {
    startConversation,
    endConversation,
    isRecording,
    wavStreamPlayer,
    wavRecorder
  };
};

export { useAudio };
