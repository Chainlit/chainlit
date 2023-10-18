import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Stack from '@mui/material/Stack';

import { IMessage } from 'src/types/message';

import { FeedbackButtons } from './FeedbackButtons';
import { PlaygroundButton } from './PlaygroundButton';

interface Props {
  message: IMessage;
}

const MessageButtons = ({ message }: Props) => {
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);

  const showPlaygroundButton = !!message.prompt && !!message.content;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableHumanFeedback &&
    !message.authorIsUser &&
    !message.waitForAnswer &&
    !!message.content;

  const show = showPlaygroundButton || showFeedbackButtons;

  if (!show) {
    return null;
  }

  return (
    <Stack alignItems="start" ml="auto" direction="row">
      {showPlaygroundButton ? <PlaygroundButton message={message} /> : null}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
    </Stack>
  );
};

export { MessageButtons };
