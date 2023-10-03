import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';

import BugReport from '@mui/icons-material/BugReport';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import { IMessage } from 'src/types/message';

interface Props {
  message: IMessage;
}

const PlaygroundButton = ({ message }: Props) => {
  const { onPlaygroundButtonClick } = useContext(MessageContext);

  return (
    <Tooltip title="Inspect in prompt playground">
      <IconButton
        size="small"
        className="playground-button"
        onClick={() => {
          onPlaygroundButtonClick && onPlaygroundButtonClick(message);
        }}
      >
        <BugReport sx={{ width: '16px', height: '16px' }} />
      </IconButton>
    </Tooltip>
  );
};

export { PlaygroundButton };
