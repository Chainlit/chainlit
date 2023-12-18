import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import Terminal from '@mui/icons-material/Terminal';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import type { IStep } from 'client-types/';

interface Props {
  step: IStep;
}

const PlaygroundButton = ({ step }: Props) => {
  const { onPlaygroundButtonClick } = useContext(MessageContext);

  return (
    <Tooltip title="Inspect in prompt playground">
      <IconButton
        color="inherit"
        className="playground-button"
        onClick={() => {
          onPlaygroundButtonClick && onPlaygroundButtonClick(step);
        }}
      >
        <Terminal sx={{ width: '18px', height: '18px' }} />
      </IconButton>
    </Tooltip>
  );
};

export { PlaygroundButton };
