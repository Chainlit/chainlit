import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import LoadingButton from '@mui/lab/LoadingButton';
import Tooltip from '@mui/material/Tooltip';

import { IAction } from 'src/types/action';

interface ActionProps {
  action: IAction;
  margin: number | string;
}

const ActionButton = ({ action, margin }: ActionProps) => {
  const { loading } = useContext(MessageContext);

  return (
    <Tooltip title={action.description} placement="top">
      <LoadingButton
        size="small"
        variant="outlined"
        id={action.id}
        onClick={action.onClick}
        disabled={loading}
        sx={{ margin }}
      >
        {action.label || action.name}
      </LoadingButton>
    </Tooltip>
  );
};

export { ActionButton };
