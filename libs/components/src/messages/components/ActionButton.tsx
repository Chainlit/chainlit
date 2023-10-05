import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { GreyButton } from 'src/buttons';

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
      <GreyButton
        size="small"
        variant="contained"
        id={action.id}
        onClick={() => {
          action.onClick();
          onClick?.();
        }}
        disabled={loading}
        sx={{ margin }}
      >
        {action.label || action.name}
      </GreyButton>
    </Tooltip>
  );
};

export { ActionButton };
