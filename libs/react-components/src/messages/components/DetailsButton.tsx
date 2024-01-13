import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { GreyButton } from 'src/buttons/GreyButton';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';

import type { IStep } from 'client-types/';

interface Props {
  message: IStep;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

const DetailsButton = ({ message, opened, onClick, loading }: Props) => {
  const messageContext = useContext(MessageContext);

  const nestedCount = message.steps?.length;
  const nested = !!nestedCount && !messageContext.hideCot;

  const lastStep = nested ? message.steps![nestedCount - 1] : undefined;

  const tool = lastStep ? lastStep.name : undefined;

  const content = message.output;

  const showDefaultLoader =
    loading && (!content || (messageContext.hideCot && !message.streaming));

  const show = tool || showDefaultLoader;

  if (!show) {
    return null;
  }

  // Don't count empty steps
  const stepCount = nestedCount
    ? message.steps!.filter((m) => !!m.output || m.steps?.length).length
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
      size="small"
      id={id}
      sx={{ marginTop: 1 }}
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
