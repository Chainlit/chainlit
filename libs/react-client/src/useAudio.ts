import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecoilValue } from 'recoil';

import { interruptAudioState, outputAudioChunkState } from './state';
import { IAudioConfig } from './types';
import { useChatInteract } from './useChatInteract';
import { WavRecorder, WavStreamPlayer } from './wavtools';

const defaultConfig: IAudioConfig = {
  enabled: true,
  sample_rate: 24000
};

const useAudio = (config = defaultConfig) => {
  const [isRecording, setIsRecording] = useState(false);
  const outputAudioChunk = useRecoilValue(outputAudioChunkState);
  const interruptAudio = useRecoilValue(interruptAudioState);

  const { sendAudioChunk, endAudioStream } = useChatInteract();

  const wavRecorderRef = useRef<WavRecorder>(
    new WavRecorder({ sampleRate: config.sample_rate })
  );
  const wavStreamPlayerRef = useRef<WavStreamPlayer>(
    new WavStreamPlayer({ sampleRate: config.sample_rate })
  );

  useEffect(() => {
    if (outputAudioChunk && wavStreamPlayerRef.current) {
      wavStreamPlayerRef.current.add16BitPCM(
        outputAudioChunk.data,
        outputAudioChunk.track
      );
    }
  }, [outputAudioChunk]);

  useEffect(() => {
    if (interruptAudio && wavStreamPlayerRef.current) {
      wavStreamPlayerRef.current.interrupt();
    }
  }, [interruptAudio]);

  const startConversation = useCallback(async () => {
    const wavRecorder = wavRecorderRef.current;
    const wavStreamPlayer = wavStreamPlayerRef.current;
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
  }, [sendAudioChunk]);

  const endConversation = useCallback(async () => {
    setIsRecording(false);

    const wavRecorder = wavRecorderRef.current;
    await wavRecorder.end();

    const wavStreamPlayer = wavStreamPlayerRef.current;
    await wavStreamPlayer.interrupt();

    await endAudioStream();
  }, [endAudioStream]);

  return {
    startConversation,
    endConversation,
    isRecording,
    wavStreamPlayerRef,
    wavRecorderRef
  };
};

export { useAudio };
