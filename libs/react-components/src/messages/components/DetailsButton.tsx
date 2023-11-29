import { MessageContext } from 'contexts/MessageContext';
import { useContext } from 'react';
import { GreyButton } from 'src/buttons/GreyButton';

import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import CircularProgress from '@mui/material/CircularProgress';

import type { StepOrMessage } from 'client-types/';

interface Props {
  message: StepOrMessage;
  opened: boolean;
  loading?: boolean;
  onClick: () => void;
}

const getContent = (message: StepOrMessage) =>
  'content' in message
    ? message.content
    : 'output' in message
    ? message.output
    : '';

const DetailsButton = ({ message, opened, onClick, loading }: Props) => {
  const messageContext = useContext(MessageContext);

  const nestedCount = message.steps?.length;
  const nested = !!nestedCount;

  const lastStep = nested ? message.steps![nestedCount - 1] : undefined;

  const tool = lastStep
    ? 'author' in lastStep
      ? lastStep.author
      : 'name' in lastStep
      ? lastStep.name
      : undefined
    : undefined;

  const content = getContent(message);

  const isRunningEmptyStep = loading && !content;

  const show = tool || isRunningEmptyStep;
  const hide = messageContext.hideCot && !isRunningEmptyStep;

  if (!show || hide) {
    return null;
  }

  // Don't count empty steps
  const stepCount = nestedCount
    ? message.steps!.filter((m) => !!getContent(m) || m.steps?.length).length
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
