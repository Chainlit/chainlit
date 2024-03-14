import { useContext } from 'react';
import { MessageContext } from 'src/contexts/MessageContext';
import type { IAction } from 'src/types';

import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';

interface ActionProps {
  action: IAction;
  margin: number | string;
  onClick?: () => void;
}

const ActionButton = ({ action, margin, onClick }: ActionProps) => {
  const { askUser, loading } = useContext(MessageContext);
  const isAskingAction = askUser?.spec.type === 'action';
  const isDisabled = isAskingAction && !askUser?.spec.keys?.includes(action.id);
  const handleClick = () => {
    if (isAskingAction) {
      askUser?.callback(action);
    } else {
      action.onClick();
      onClick?.();
    }
  };

  return (
    <Tooltip title={action.description} placement="top">
      <span>
        <Button
          size="small"
          variant="outlined"
          sx={{
            textTransform: 'none',
            margin
          }}
          id={action.id}
          onClick={handleClick}
          disabled={loading || isDisabled}
        >
          {action.label || action.name}
        </Button>
      </span>
    </Tooltip>
  );
};

export { ActionButton };
