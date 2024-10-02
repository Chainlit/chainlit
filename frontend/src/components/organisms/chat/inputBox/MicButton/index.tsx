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
  const { startConversation, endConversation, isRecording } = useAudio(
    config?.features.audio
  );

  useHotkeys('p', startConversation);

  const size = useMediaQuery<Theme>((theme) => theme.breakpoints.down('sm'))
    ? 'small'
    : 'medium';

  if (!config?.features.audio.enabled) return null;

  return (
    <>
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
