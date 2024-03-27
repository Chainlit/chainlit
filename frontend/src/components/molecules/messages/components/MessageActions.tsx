import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';

import type { IAction, IStep } from 'client-types/';

import { ActionButton } from './ActionButton';
import { ActionDrawerButton } from './ActionDrawerButton';

interface Props {
  message: IStep;
  actions: IAction[];
}

const MessageActions = ({ message, actions }: Props) => {
  const scopedActions = actions.filter((a) => {
    if (a.forId) {
      return a.forId === message.id;
    }
    return true;
  });

  const displayedActions = scopedActions.filter((a) => !a.collapsed);
  const drawerActions = scopedActions.filter((a) => a.collapsed);

  const show = displayedActions.length || drawerActions.length;

  if (!show) {
    return null;
  }

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
        {drawerActions.length ? (
          <ActionDrawerButton actions={drawerActions} />
        ) : null}
      </Box>
    </Stack>
  );
};

export { MessageActions };
