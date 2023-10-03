import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import { IAction } from 'src/types/action';
import { IMessage } from 'src/types/message';

import { ActionButton } from './ActionButton';
import { ActionDrawerButton } from './ActionDrawerButton';
import { FeedbackButtons } from './FeedbackButtons';
import { PlaygroundButton } from './PlaygroundButton';

interface Props {
  message: IMessage;
  actions: IAction[];
}

const MessageButtons = ({ message, actions }: Props) => {
  const { showFeedbackButtons: showFbButtons } = useContext(MessageContext);

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const scopedActions = actions.filter((a) => {
    if (a.forId) {
      return a.forId === message.id;
    }
    return true;
  });

  const displayedActions = isMobile
    ? []
    : scopedActions.filter((a) => !a.collapsed);
  const drawerActions = isMobile
    ? scopedActions
    : scopedActions.filter((a) => a.collapsed);

  const showPlaygroundButton = !!message.prompt && !!message.content;

  const showFeedbackButtons =
    showFbButtons &&
    !message.disableHumanFeedback &&
    !message.authorIsUser &&
    !message.waitForAnswer &&
    !!message.content;

  return (
    <Stack
      direction="row"
      spacing={1}
      alignItems="start"
      justifyContent="space-between"
      width="100%"
    >
      <Box id="actions-list">
        {displayedActions.map((action) => (
          <ActionButton
            key={action.id}
            action={action}
            margin={'2px 8px 6px 0'}
          />
        ))}
      </Box>
      <Stack minHeight="32px" direction="row" spacing={1} alignItems="center">
        {drawerActions.length ? (
          <ActionDrawerButton actions={drawerActions} />
        ) : null}
        {showPlaygroundButton ? <PlaygroundButton message={message} /> : null}
        {showFeedbackButtons ? <FeedbackButtons message={message} /> : null}
      </Stack>
    </Stack>
  );
};

export { MessageButtons };
