import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { ClipboardCopy } from 'src/ClipboardCopy';
import { grey } from 'theme/palette';

import Stack from '@mui/material/Stack';

import { useIsDarkMode } from 'hooks/useIsDarkMode';

import type { IStep } from 'client-types/';

import { FeedbackButtons } from './FeedbackButtons';
import { PlaygroundButton } from './PlaygroundButton';

interface Props {
  message: IStep;
}

const MessageButtons = ({ message }: Props) => {
  const isDark = useIsDarkMode();
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);

  const showPlaygroundButton = !!message.generation;
  const isUser = message.type === 'user_message';
  const isAsk = message.waitForAnswer;
  const hasContent = !!message.output;
  const showCopyButton =
    hasContent && !isUser && !isAsk && !message.disableFeedback;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableFeedback &&
    !isUser &&
    !isAsk &&
    hasContent;

  const show = showCopyButton || showPlaygroundButton || showFeedbackButtons;

  if (!show) {
    return null;
  }

  return (
    <Stack
      sx={{ marginLeft: '-8px !important' }}
      alignItems="center"
      direction="row"
      color={isDark ? grey[400] : grey[600]}
    >
      {showCopyButton ? <ClipboardCopy value={message.output} /> : null}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
      {showPlaygroundButton ? <PlaygroundButton step={message} /> : null}
    </Stack>
  );
};

export { MessageButtons };
