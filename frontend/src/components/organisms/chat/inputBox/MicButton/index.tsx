import { useHotkeys } from 'react-hotkeys-hook';

import { IconButton, Theme, Tooltip, useMediaQuery } from '@mui/material';

import { useAudio, useConfig } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import MicrophoneIcon from 'assets/microphone';
import MicrophoneOffIcon from 'assets/microphoneOff';

interface Props {
  disabled?: boolean;
}

const MicButton = ({ disabled }: Props) => {
  const { config } = useConfig();
  const { startConversation, endConversation, isRecording } = useAudio();
  const isEnabled = !!config?.features.audio.enabled;

  useHotkeys(
    'p',
    () => {
      if (!isEnabled) return;
      if (isRecording) return endConversation();
      return startConversation();
    },
    [isEnabled, isRecording]
  );

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!isEnabled) return null;

  return (
    <>
      <Tooltip
        title={
          <Translator
            path={
              isRecording
                ? 'components.organisms.chat.inputBox.speechButton.stop'
                : 'components.organisms.chat.inputBox.speechButton.start'
            }
            suffix=" (P)"
          />
        }
      >
        <span>
          <IconButton
            disabled={disabled}
            color="inherit"
            size={size}
            onClick={isRecording ? endConversation : startConversation}
          >
            {isRecording ? (
              <MicrophoneOffIcon fontSize={size} />
            ) : (
              <MicrophoneIcon fontSize={size} />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
export default MicButton;
