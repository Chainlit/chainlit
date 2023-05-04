import { LoadingButton } from '@mui/lab';
import { Tooltip } from '@mui/material';
import { IAction } from 'state/action';
import { callAction } from 'api';
import { toast } from 'react-hot-toast';
import { useRecoilValue } from 'recoil';
import { loadingState } from 'state/chat';

interface Props {
  action: IAction;
}

export default function ActionRef({ action }: Props) {
  const loading = useRecoilValue(loadingState);

  const call = async () => {
    try {
      await callAction(action);
    } catch (err) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  const button = (
    <LoadingButton
      id={`action-${action.name}`}
      onClick={call}
      disabled={loading}
    >
      {action.trigger}
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
