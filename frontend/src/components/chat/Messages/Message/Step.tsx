import { cn } from '@/lib/utils';
import {
  AlertCircle,
  BookOpen,
  Brain,
  Calculator,
  Database,
  LayoutPanelLeft,
  Loader,
  Workflow
} from 'lucide-react';
import { PropsWithChildren, useMemo } from 'react';

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
}

/* -------------------- Icon mapping -------------------- */
function StepIcon({
  name,
  using,
  isError
}: {
  name: string;
  using: boolean;
  isError: boolean;
}) {
  if (isError) return <AlertCircle className="h-4 w-4" aria-hidden />;
  if (using) return <Loader className="h-4 w-4 animate-spin" aria-hidden />;

  const n = (name || '').toLowerCase();
  if (n.includes('tænker') || n.includes('think'))
    return <Brain className="h-4 w-4" aria-hidden />;
  if (n.includes('hukommelse') || n.includes('memory'))
    return <BookOpen className="h-4 w-4" aria-hidden />;
  if (n.includes('henter data') || n.includes('fetch') || n.includes('data'))
    return <Database className="h-4 w-4" aria-hidden />;
  if (n.includes('beregner') || n.includes('compute') || n.includes('python'))
    return <Calculator className="h-4 w-4" aria-hidden />;
  if (n.includes('dashboard') || n.includes('update'))
    return <LayoutPanelLeft className="h-4 w-4" aria-hidden />;
  return <Workflow className="h-4 w-4" aria-hidden />;
}

/* -------------------- Header row (28px) -------------------- */
function StepHeader({
  label,
  isError,
  using
}: {
  label: string;
  isError: boolean;
  using: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 min-h-[28px] leading-none',
        isError && 'text-red-500',
        !using && 'text-muted-foreground',
        using && 'loading-shimmer'
      )}
    >
      {using ? (
        <>
          <Translator path="chat.messages.status.using" /> {label}
        </>
      ) : (
        <>
          <Translator path="chat.messages.status.used" /> {label}
        </>
      )}
    </div>
  );
}

/* -------------------- Step card (Accordion) -------------------- */
function StepCard({ step, isRunning }: Props) {
  const using = useMemo(
    () => Boolean(isRunning && step.start && !step.end && !step.isError),
    [isRunning, step.start, step.end, step.isError]
  );

  const hasContent = step.input || step.output || step.steps?.length;
  const isError = !!step.isError;
  const stepName = step.name;

  if (!hasContent) {
    return <StepHeader label={stepName} isError={isError} using={using} />;
  }

  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={step.defaultOpen ? step.id : undefined}
      className="w-full max-w-full" // ⬅ contain to stepper width
    >
      <AccordionItem value={step.id} className="border-none">
        <AccordionTrigger
          className={cn(
            'p-0 h-auto min-h-0 my-0 transition-none hover:no-underline text-left',
            'flex items-center w-full', // ⬅ full width trigger
            isError && 'text-red-500',
            !using && 'text-muted-foreground hover:text-foreground',
            using && 'loading-shimmer'
          )}
          id={`step-${stepName}`}
        >
          <StepHeader label={stepName} isError={isError} using={using} />
        </AccordionTrigger>

        <AccordionContent className="w-full max-w-full">
          {/* The content wrapper MUST be allowed to shrink inside grid/flex → min-w-0 */}
          <div className="mt-4 space-y-4 min-w-0 max-w-full">
            {step.input && (
              <div className="min-w-0 max-w-full">
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Input
                </div>
                <pre
                  className={cn(
                    'rounded-md bg-muted p-3 text-sm',
                    'min-w-0 max-w-full', // ⬅ never exceed card width
                    'whitespace-pre-wrap break-words' // ⬅ wrap long lines / tokens
                  )}
                >
                  {step.language === 'python'
                    ? step.input
                    : typeof step.input === 'string'
                    ? step.input
                    : JSON.stringify(step.input, null, 2)}
                </pre>
              </div>
            )}

            {step.output && (
              <div className="min-w-0 max-w-full">
                <div className="text-xs uppercase text-muted-foreground mb-1">
                  Output
                </div>
                <pre
                  className={cn(
                    'rounded-md bg-muted p-3 text-sm',
                    'min-w-0 max-w-full',
                    'whitespace-pre-wrap break-words'
                  )}
                >
                  {typeof step.output === 'string'
                    ? step.output
                    : JSON.stringify(step.output, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

/* -------------------- One item in the vertical stepper -------------------- */
function StepperItem({
  step,
  isRunning,
  isFirst,
  isLast
}: Props & { isFirst: boolean; isLast: boolean }) {
  const using = Boolean(isRunning && step.start && !step.end && !step.isError);

  const NODE_SIZE = 28;
  const HEADER_OFFSET = 2;

  return (
    <li className="grid grid-cols-[1.75rem,1fr] gap-3 w-full min-w-0">
      {' '}
      {/* ⬅ allow grid to shrink */}
      {/* Left rail + node */}
      <div className="relative h-full">
        {!isFirst && (
          <span
            className="absolute left-1/2 -translate-x-1/2 w-px bg-border"
            style={{ top: 0, height: NODE_SIZE / 2 + HEADER_OFFSET }}
            aria-hidden
          />
        )}

        <span
          className={cn(
            'relative z-[1] inline-flex h-[28px] w-[28px] items-center justify-center rounded-full border bg-background',
            step.isError && 'border-red-400',
            using && 'ring-2 ring-offset-2 ring-primary/40'
          )}
          style={{ marginTop: HEADER_OFFSET }}
          aria-hidden
        >
          <StepIcon name={step.name} using={!!using} isError={!!step.isError} />
        </span>

        {!isLast && (
          <span
            className="absolute left-1/2 -translate-x-1/2 w-px bg-border"
            style={{ top: NODE_SIZE / 2 + HEADER_OFFSET, bottom: 0 }}
            aria-hidden
          />
        )}
      </div>
      {/* Right column: IMPORTANT → min-w-0 to contain long text */}
      <div className="pb-4 min-w-0 w-full max-w-full">
        <StepCard step={step} isRunning={isRunning} />
      </div>
    </li>
  );
}

/* -------------------- Stepper list -------------------- */
function StepperList({
  steps,
  isRunning
}: {
  steps: IStep[];
  isRunning?: boolean;
}) {
  if (steps.length === 0) return null;

  return (
    <ol role="list" className="w-full min-w-0">
      {' '}
      {/* ⬅ list itself can shrink */}
      {steps.map((child, idx) => (
        <StepperItem
          key={child.id ?? `${child.name}-${idx}`}
          step={child}
          isRunning={isRunning}
          isFirst={idx === 0}
          isLast={idx === steps.length - 1}
        />
      ))}
    </ol>
  );
}

/* -------------------- Public component -------------------- */
export default function Step({ step, isRunning }: PropsWithChildren<Props>) {
  const children = (step.steps?.length ?? 0) > 0 ? step.steps! : [step];

  return (
    <div className="flex flex-col flex-grow w-0 min-w-0">
      {' '}
      {/* ⬅ outer container can also shrink */}
      <StepperList steps={children} isRunning={isRunning} />
    </div>
  );
}
