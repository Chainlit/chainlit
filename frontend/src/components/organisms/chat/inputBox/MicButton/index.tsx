import { useHotkeys } from 'react-hotkeys-hook';

import {
  CircularProgress,
  IconButton,
  Theme,
  Tooltip,
  useMediaQuery
} from '@mui/material';

import { useAudio, useConfig } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

import MicrophoneIcon from 'assets/microphone';
import MicrophoneOffIcon from 'assets/microphoneOff';

interface Props {
  disabled?: boolean;
}

const MicButton = ({ disabled }: Props) => {
  const { config } = useConfig();
  const { startConversation, endConversation, audioConnection } = useAudio();
  const isEnabled = !!config?.features.audio.enabled;

  useHotkeys(
    'p',
    () => {
      if (!isEnabled) return;
      if (audioConnection === 'on') return endConversation();
      return startConversation();
    },
    [isEnabled, audioConnection, startConversation, endConversation]
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
              audioConnection === 'on'
                ? 'components.organisms.chat.inputBox.speechButton.stop'
                : audioConnection === 'off'
                ? 'components.organisms.chat.inputBox.speechButton.start'
                : 'components.organisms.chat.inputBox.speechButton.loading'
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
            onClick={
              audioConnection === 'on'
                ? endConversation
                : audioConnection === 'off'
                ? startConversation
                : undefined
            }
          >
            {audioConnection === 'on' ? (
              <MicrophoneOffIcon fontSize={size} />
            ) : null}
            {audioConnection === 'off' ? (
              <MicrophoneIcon fontSize={size} />
            ) : null}
            {audioConnection === 'connecting' ? (
              <CircularProgress
                color="inherit"
                variant="indeterminate"
                size={18}
              />
            ) : null}
          </IconButton>
        </span>
      </Tooltip>
    </>
  );
};
export default MicButton;
