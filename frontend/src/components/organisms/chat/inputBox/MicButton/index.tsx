import { useCallback, useEffect, useMemo } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { useRecoilState, useRecoilValue } from 'recoil';
import { toast } from 'sonner';

import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { askUserState, useAudio, useConfig } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import MicrophoneIcon from 'assets/microphone';

import { attachmentsState } from 'state/chat';

import RecordScreen from './RecordScreen';

interface Props {
  disabled?: boolean;
}

const MicButton = ({ disabled }: Props) => {
  const askUser = useRecoilValue(askUserState);
  const { config } = useConfig();
  const {
    startRecording: _startRecording,
    isRecording,
    isSpeaking,
    isRecordingFinished,
    error
  } = useAudio(config?.features.audio);
  const [attachments, setAttachments] = useRecoilState(attachmentsState);

  disabled = disabled || !!askUser;

  useEffect(() => {
    if (isRecordingFinished) setAttachments([]);
  }, [isRecordingFinished]);

  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  const fileReferences = useMemo(() => {
    return attachments
      ?.filter((a) => !!a.serverId)
      .map((a) => ({ id: a.serverId! }));
  }, [attachments]);

  const startRecording = useCallback(() => {
    if (disabled) return;
    _startRecording(fileReferences);
  }, [_startRecording, fileReferences, disabled]);

  useHotkeys('p', startRecording);

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!config?.features.audio.enabled) return null;

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
            <MicrophoneIcon fontSize={size} />
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
export default MicButton;
