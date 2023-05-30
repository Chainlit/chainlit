import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';
import { IAction } from 'state/action';
import { toast } from 'react-hot-toast';
import { useRecoilValue } from 'recoil';
import { loadingState, sessionState } from 'state/chat';
import { useCallback } from 'react';

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
      session?.socket.emit('call_action', action);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  }, [session]);
  const formattedName = action.name.trim().toLowerCase().replaceAll(' ', '-');
  const id = `action-${formattedName}`;
  const button = (
    <LoadingButton id={id} onClick={call} disabled={loading}>
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
