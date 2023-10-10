import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

import { IAction } from 'src/types/action';

interface ActionProps {
  action: IAction;
  margin: number | string;
  onClick?: () => void;
}

const ActionButton = ({ action, margin, onClick }: ActionProps) => {
  const { loading } = useContext(MessageContext);

  return (
    <Tooltip title={action.description} placement="top">
      <Button
        size="small"
        variant="outlined"
        sx={{
          textTransform: 'none',
          margin
        }}
        id={action.id}
        onClick={() => {
          action.onClick();
          onClick?.();
        }}
        disabled={loading}
      >
        {action.label || action.name}
      </Button>
    </Tooltip>
  );
};

export { ActionButton };
