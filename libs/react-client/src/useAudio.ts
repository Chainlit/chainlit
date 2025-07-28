import { useCallback } from 'react';

import { useChatStore } from './store/chat';
import { useChatInteract } from './useChatInteract';

const useAudio = () => {
  const audioConnection = useChatStore((state) => state.audioConnection);
  const setAudioConnection = useChatStore((state) => state.setAudioConnection);
  const wavRecorder = useChatStore((state) => state.wavRecorder);
  const wavStreamPlayer = useChatStore((state) => state.wavStreamPlayer);
  const isAiSpeaking = useChatStore((state) => state.isAiSpeaking);

  const { startAudioStream, endAudioStream } = useChatInteract();

  const startConversation = useCallback(async () => {
    setAudioConnection('connecting');
    await startAudioStream();
  }, [startAudioStream]);

  const endConversation = useCallback(async () => {
    setAudioConnection('off');
    await wavRecorder.end();
    await wavStreamPlayer.interrupt();
    await endAudioStream();
  }, [endAudioStream, wavRecorder, wavStreamPlayer]);

  return {
    startConversation,
    endConversation,
    audioConnection,
    isAiSpeaking,
    wavRecorder,
    wavStreamPlayer
  };
};

export { useAudio };
