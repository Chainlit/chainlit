import { useContext } from 'react';
import { MessageContext } from 'src/contexts/MessageContext';
import { grey } from 'src/theme/palette';
import type { IStep } from 'src/types';

import Stack from '@mui/material/Stack';

import { ClipboardCopy } from 'src/components/ClipboardCopy';

import { useIsDarkMode } from 'src/api/hooks/useIsDarkMode';

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
