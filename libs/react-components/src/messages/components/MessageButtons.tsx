import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Stack from '@mui/material/Stack';

import type { StepOrMessage } from 'client-types/';

import { FeedbackButtons } from './FeedbackButtons';
import { PlaygroundButton } from './PlaygroundButton';

interface Props {
  message: StepOrMessage;
}

const MessageButtons = ({ message }: Props) => {
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);

  const showPlaygroundButton = 'generation' in message && !!message.generation;
  const isUser = 'role' in message && message.role === 'user';
  const isAsk = 'waitForAnswer' in message && message.waitForAnswer;
  const hasContent =
    'content' in message
      ? !!message.content
      : 'output' in message
      ? !!message.output
      : false;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableFeedback &&
    !isUser &&
    !isAsk &&
    hasContent;

  const show = showPlaygroundButton || showFeedbackButtons;

  if (!show) {
    return null;
  }

  return (
    <Stack alignItems="start" ml="auto" direction="row">
      {showPlaygroundButton ? <PlaygroundButton step={message} /> : null}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
    </Stack>
  );
};

export { MessageButtons };
