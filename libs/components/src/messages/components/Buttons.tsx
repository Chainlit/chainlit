import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { ActionList } from 'src/ActionList';

import { BugReport } from '@mui/icons-material';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { IAction } from 'src/types/action';
import { IMessage } from 'src/types/message';

import { FeedbackButtons } from './FeedbackButtons';

interface Props {
  message: IMessage;
  actions: IAction[];
}

const Buttons = ({ message, actions }: Props) => {
  const { onPlaygroundButtonClick, showFeedbackButtons: showFbButtons } =
    useContext(MessageContext);

  const scopedActions = actions.filter((a) => {
    if (a.forId) {
      return a.forId === message.id;
    }
    return true;
  });

  const showEditButton = !!message.prompt && !!message.content;

  const editButton = showEditButton ? (
    <Tooltip title="Inspect in prompt playground">
      <IconButton
        size="small"
        className="playground-button"
        onClick={() => {
          if (!message.prompt) return;
          onPlaygroundButtonClick && onPlaygroundButtonClick(message);
        }}
      >
        <BugReport sx={{ width: '16px', height: '16px' }} />
      </IconButton>
    </Tooltip>
  ) : null;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableHumanFeedback &&
    !message.authorIsUser &&
    !message.waitForAnswer &&
    !!message.content;

  return (
    <Stack direction="row" spacing={1}>
      {editButton}
      {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
      {scopedActions.length ? <ActionList actions={scopedActions} /> : null}
    </Stack>
  );
};

export { Buttons };
