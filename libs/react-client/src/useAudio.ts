import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import {
  audioConnectionState,
  isAiSpeakingState,
  wavRecorderState,
  wavStreamPlayerState
} from './state';
import { useChatInteract } from './useChatInteract';

const useAudio = () => {
  const [audioConnection, setAudioConnection] =
    useRecoilState(audioConnectionState);
  const wavRecorder = useRecoilValue(wavRecorderState);
  const wavStreamPlayer = useRecoilValue(wavStreamPlayerState);
  const isAiSpeaking = useRecoilValue(isAiSpeakingState);

  const { startAudioStream, endAudioStream, discardAudioStream } =
    useChatInteract();

  const startConversation = useCallback(async () => {
    setAudioConnection('connecting');
    await startAudioStream();
  }, [startAudioStream]);

  const stopRecording = useCallback(async () => {
    setAudioConnection('off');
    await Promise.all([wavRecorder.end(), wavStreamPlayer.interrupt()]);
  }, [wavRecorder, wavStreamPlayer]);

  const endConversation = useCallback(async () => {
    await stopRecording();
    await endAudioStream();
  }, [stopRecording, endAudioStream]);

  const discardConversation = useCallback(async () => {
    await stopRecording();
    await discardAudioStream();
  }, [stopRecording, discardAudioStream]);

  return {
    startConversation,
    endConversation,
    discardConversation,
    audioConnection,
    isAiSpeaking,
    wavRecorder,
    wavStreamPlayer
  };
};

export { useAudio };
