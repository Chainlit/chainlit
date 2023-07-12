import { useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useRecoilValue } from 'recoil';

import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';

import { IAction } from 'state/action';
import { loadingState, sessionState } from 'state/chat';

interface Props {
  action: IAction;
}

export default function ActionRef({ action }: Props) {
  const loading = useRecoilValue(loadingState);
  const session = useRecoilValue(sessionState);

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
  const formattedName = action.name.trim().toLowerCase().replaceAll(' ', '-');
  const className = `action-${formattedName}`;
  const button = (
    <LoadingButton className={className} onClick={call} disabled={loading}>
      {action.label || action.name}
    </LoadingButton>
  );
  if (action.description) {
    return (
      <Tooltip title={action.description} placement="top">
        {button}
      </Tooltip>
    );
  } else {
    return button;
  }
}
