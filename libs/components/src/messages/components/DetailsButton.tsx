import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { GreyButton } from 'src/buttons/GreyButton';

import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { CircularProgress } from '@mui/material';

import { INestedMessage } from 'src/types/message';

interface Props {
  message: INestedMessage;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

const DetailsButton = ({ message, opened, onClick, loading }: Props) => {
  const messageContext = useContext(MessageContext);

  const nestedCount = message.subMessages?.length;
  const nested = !!nestedCount;

  const tool = nested
    ? message.subMessages![nestedCount - 1].author
    : undefined;

  const isRunningEmptyStep = loading && !message.content;
  const isRunningUserMessage = loading && message.authorIsUser;

  const show = nested || isRunningEmptyStep || isRunningUserMessage;

  if (!show || messageContext.hideCot) {
    return null;
  }

  // Don't count empty steps
  const stepCount = nestedCount
    ? message.subMessages!.filter((m) => !!m.content).length
    : 0;

  const text = loading
    ? tool
      ? `Using ${tool}`
      : 'Running'
    : `Took ${stepCount} step${stepCount <= 1 ? '' : 's'}`;

  let id = '';
  if (tool) {
    id = tool.trim().toLowerCase().replaceAll(' ', '-');
  }
  if (loading) {
    id += '-loading';
  } else {
    id += '-done';
  }

  return (
    <GreyButton
      id={id}
      disableElevation
      disableRipple
      sx={{
        textTransform: 'none'
      }}
      color="primary"
      startIcon={
        loading ? <CircularProgress color="inherit" size={16} /> : undefined
      }
      variant="contained"
      endIcon={
        nested && tool ? opened ? <ExpandLess /> : <ExpandMore /> : undefined
      }
      onClick={tool ? onClick : undefined}
    >
      {text}
    </GreyButton>
  );
};

export { DetailsButton };
