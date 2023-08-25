import React from 'react';
import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilValue } from 'recoil';

import { LoadingButton } from '@mui/lab';
import { Box, Menu, Stack, Theme, useMediaQuery } from '@mui/material';
import { Tooltip } from '@mui/material';

import { loadingState, sessionState } from 'state/chat';

import { IAction } from 'types/action';
import { ISession } from 'types/chat';

import RegularButton from './buttons/button';

interface ActionProps {
  action: IAction;
  loading: boolean;
  session?: ISession;
}

const Action = ({ action, loading, session }: ActionProps) => {
  const call = useCallback(async () => {
    try {
      const sessionId = session?.socket.id;

      if (!sessionId) {
        return;
      }
      session?.socket.emit('action_call', action);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }, [session]);

  const button = (
    <LoadingButton id={action.id} onClick={call} disabled={loading}>
      {action.label || action.name}
    </LoadingButton>
  );

  return (
    <Tooltip title={action.description} placement="top">
      {button}
    </Tooltip>
  );
};

export default function ActionList({ actions }: { actions: IAction[] }) {
  const loading = useRecoilValue(loadingState);
  const session = useRecoilValue(sessionState);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const isMobile = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down('sm')
  );

  const renderActions = (items: IAction[]) =>
    items.map((action) => (
      <Action
        key={action.id}
        action={action}
        loading={loading}
        session={session}
      />
    ));

  return (
    <Box id="actions-list" margin="auto">
      {!isMobile ? renderActions(actions.slice(0, 2)) : null}
      {actions.length > 2 ? (
        <>
          <RegularButton
            id="actions-button"
            onClick={(event: React.MouseEvent<HTMLElement>) =>
              setAnchorEl(event.currentTarget)
            }
          >
            More actions
          </RegularButton>
          <Menu
            id="actions-menu"
            anchorEl={anchorEl}
            open={!!anchorEl}
            onClose={() => setAnchorEl(null)}
            sx={{ marginTop: 1 }}
          >
            <Stack direction="column" paddingX={2} gap={1}>
              {renderActions(
                isMobile ? actions : actions.slice(2, actions.length)
              )}
            </Stack>
          </Menu>
        </>
      ) : null}
    </Box>
  );
}
