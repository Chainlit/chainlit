import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Stack from '@mui/material/Stack';

import type { IStep } from 'client-types/';

import { FeedbackButtons } from './FeedbackButtons';
import { PlaygroundButton } from './PlaygroundButton';

interface Props {
  message: IStep;
}

const MessageButtons = ({ message }: Props) => {
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);

  const showPlaygroundButton = !!message.generation;
  const isUser = message.type === 'user_message';
  const isAsk = message.waitForAnswer;
  const hasContent = !!message.output;

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
