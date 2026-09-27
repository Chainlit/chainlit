import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import {
  PropsWithChildren,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import type { IStep } from '@chainlit/react-client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Translator } from 'components/i18n';

interface Props {
  step: IStep;
  isRunning?: boolean;
  nestedSteps?: ReactNode;
}

export default function Step({
  step,
  children,
  isRunning,
  nestedSteps
}: PropsWithChildren<Props>) {
  const { showStepDetails } = useContext(MessageContext);

  const using = useMemo(() => {
    return isRunning && step.start && !step.end && !step.isError;
  }, [step, isRunning]);

  const hasSubSteps = !!step.steps?.length;
  const hasContent = step.input || step.output || hasSubSteps;
  // Flat mode's accordion body renders only non-message sub-steps, so a step whose
  // children are all messages isn't expandable there (it would open to nothing).
  const hasVisibleSubSteps =
    step.steps?.some((s) => !s.type.includes('message')) ?? false;
  const expandable = showStepDetails ? Boolean(hasContent) : hasVisibleSubSteps;
  const isError = step.isError;
  const stepName = step.name;

  const [openValue, setOpenValue] = useState<string>(
    step.defaultOpen ? step.id : ''
  );

  // Auto-collapse when step finishes if autoCollapse is set
  useEffect(() => {
    if (!using && step.autoCollapse) {
      setOpenValue('');
    }
  }, [using, step.autoCollapse]);

  // Nothing to expand: render a flat status label.
  if (!expandable) {
    return (
      <div className="flex flex-col flex-grow w-0">
        <p
          className={cn(
            'flex items-center gap-1 font-medium mt-[3px]',
            isError && 'text-red-500',
            !using && 'text-muted-foreground',
            using && 'loading-shimmer'
          )}
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
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-grow w-0">
      <Accordion
        type="single"
        collapsible
        value={openValue}
        onValueChange={(val) => setOpenValue(val)}
        className="w-full"
      >
        <AccordionItem value={step.id} className="border-none">
          <AccordionTrigger
            className={cn(
              'flex items-center gap-1 justify-start transition-none p-0 hover:no-underline mt-[3px]',
              isError && 'text-red-500',
              !using && 'text-muted-foreground hover:text-foreground',
              using && 'loading-shimmer'
            )}
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
          </AccordionTrigger>
          <AccordionContent>
            <div className="flex-grow mt-4 ml-1 pl-4 border-l-2 border-primary">
              {showStepDetails ? children : nestedSteps}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
