import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

import DebugIcon from 'assets/debug';

import type { IStep } from 'client-types/';

interface Props {
  debugUrl: string;
  step: IStep;
}

const DebugButton = ({ step, debugUrl }: Props) => {
  if (step.id.startsWith('wrap_')) {
    return null;
  }
  const href = debugUrl
    .replace('[thread_id]', step.threadId!)
    .replace('[step_id]', step.id);
  return (
    <Tooltip title="Debug in Literal">
      <IconButton
        color="inherit"
        className="debug-button"
        href={href}
        target="_blank"
      >
        <DebugIcon sx={{ width: '18px', height: '18px' }} />
      </IconButton>
    </Tooltip>
  );
};

export { DebugButton };
