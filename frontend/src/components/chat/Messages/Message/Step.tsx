import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PropsWithChildren, useMemo, useState } from 'react';

import type { IStep } from '@chainlit/react-client';

import { Translator } from 'components/i18n';

interface Props {
  step: IStep;
  isRunning?: boolean;
}

export default function Step({
  step,
  children,
  isRunning
}: PropsWithChildren<Props>) {
  const [open, setOpen] = useState(false);
  const using = useMemo(() => {
    return isRunning && step.start && !step.end && !step.isError;
  }, [step, isRunning]);

  const hasContent = step.input || step.output || step.steps?.length;
  const isError = step.isError;

  const stepName = step.name;

  return (
    <div className="flex flex-col flex-grow w-0">
      <p
        className={cn(
          'flex items-center group/step',
          isError && 'text-red-500',
          hasContent && 'cursor-pointer',
          !using && 'text-muted-foreground hover:text-foreground',
          using && 'loading-shimmer'
        )}
        onClick={() => setOpen(!open)}
        id={`step-${stepName}`}
      >
        {using ? (
          <>
            <Translator path="chat.messages.status.using" /> {stepName}
          </>
        ) : (
          <>
            <Translator path="chat.messages.status.used" /> {stepName}
          </>
        )}
        {hasContent ? (
          open ? (
            <ChevronUp className="invisible group-hover/step:visible !size-4 ml-1" />
          ) : (
            <ChevronDown className="invisible group-hover/step:visible !size-4 ml-1" />
          )
        ) : null}
      </p>

      {open && (
        <div className="flex-grow mt-4 ml-2 pl-4 border-l-2 border-primary">
          {children}
        </div>
      )}
    </div>
  );
}
