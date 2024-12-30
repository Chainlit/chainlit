import { BugIcon } from 'lucide-react';

import { IStep } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

interface DebugButtonProps {
  debugUrl: string;
  step: IStep;
}

const DebugButton = ({ step, debugUrl }: DebugButtonProps) => {
  let stepId = step.id;
  if (stepId.startsWith('wrap_')) {
    stepId = stepId.replace('wrap_', '');
  }

  const href = debugUrl
    .replace('[thread_id]', step.threadId ?? '')
    .replace('[step_id]', stepId);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 p-0" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <BugIcon />
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Debug in Literal AI</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export { DebugButton };
