import { cn } from '@/lib/utils';
import { MessageContext } from 'contexts/MessageContext';
import { memo, useContext, useMemo, useState } from 'react';

import type { IAction, IMessageElement, IStep } from '@chainlit/react-client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Translator } from 'components/i18n';

import { Messages } from '.';
import { MessageAvatar } from './Message/Avatar';

interface Props {
  steps: IStep[];
  elements: IMessageElement[];
  actions: IAction[];
  indent: number;
  isRunning?: boolean;
  scorableRun?: IStep;
}

// Recursively collect tool/step-type nodes for counting and naming
const collectVisible = (steps: IStep[], cot: string): IStep[] => {
  const result: IStep[] = [];
  for (const s of steps) {
    if (!s.type.includes('message')) {
      if (cot !== 'tool_call' || s.type === 'tool') result.push(s);
    }
    if (s.steps) result.push(...collectVisible(s.steps, cot));
  }
  return result;
};

// Assistant messages are lifted to the root by the parent, so drop them at
// every depth to avoid trapping them inside the collapsed accordion.
const stripMessages = (steps: IStep[]): IStep[] =>
  steps
    .filter((s) => !s.type.includes('message'))
    .map((s) => (s.steps ? { ...s, steps: stripMessages(s.steps) } : s));

const CompactSteps = memo(
  ({ steps, elements, actions, indent, isRunning, scorableRun }: Props) => {
    const { cot } = useContext(MessageContext);
    const [openValue, setOpenValue] = useState<string>('');

    // Steps to render inside the accordion, with assistant messages stripped
    // at every depth (they render at the root instead).
    const stepChildren = useMemo(() => stripMessages(steps), [steps]);

    // Recursively collected visible steps for count and label
    const visibleSteps = useMemo(() => {
      return collectVisible(steps, cot);
    }, [steps, cot]);

    // Show "Using" until an assistant_message appears (meaning tools are done
    // and the model is streaming). This avoids flashing between sequential tools
    // (no assistant_message yet) while still switching once the answer begins.
    const hasAnswer = useMemo(() => {
      const check = (items: IStep[]): boolean =>
        items.some(
          (s) =>
            s.type === 'assistant_message' || (s.steps ? check(s.steps) : false)
        );
      return check(steps);
    }, [steps]);

    const showUsing = !!isRunning && !hasAnswer;

    // Get the last visible step name for the "Using X" label
    const lastStep = visibleSteps[visibleSteps.length - 1];
    const lastStepName = lastStep?.name || '';

    // Determine the label translation key for the finished state
    const usedLabelPath =
      cot === 'tool_call'
        ? 'chat.messages.status.usedTools'
        : 'chat.messages.status.usedSteps';

    const accordionId = 'compact-steps';

    return (
      <div className="step py-2" data-testid="compact-steps">
        <div className="flex flex-grow pb-2">
          <div className="ai-message flex gap-4 w-full">
            <MessageAvatar
              author={
                lastStep?.metadata?.avatarName || lastStep?.name || 'Assistant'
              }
              isError={lastStep?.isError}
              iconName={lastStep?.metadata?.icon}
            />
            <div className="flex flex-col flex-grow w-0">
              <Accordion
                type="single"
                collapsible
                value={openValue}
                onValueChange={(val) => setOpenValue(val)}
                className="w-full"
              >
                <AccordionItem value={accordionId} className="border-none">
                  <AccordionTrigger
                    data-testid="compact-steps-trigger"
                    className={cn(
                      'flex items-center gap-1 justify-start transition-none p-0 hover:no-underline mt-[3px]',
                      !showUsing &&
                        'text-muted-foreground hover:text-foreground',
                      showUsing && 'loading-shimmer'
                    )}
                  >
                    {showUsing ? (
                      <>
                        <Translator path="chat.messages.status.using" />{' '}
                        {lastStepName}
                      </>
                    ) : (
                      <Translator
                        path={usedLabelPath}
                        options={{ count: visibleSteps.length }}
                      />
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex-grow mt-4 ml-1 pl-4 border-l-2 border-primary">
                      <Messages
                        messages={stepChildren}
                        elements={elements}
                        actions={actions}
                        indent={indent + 1}
                        isRunning={isRunning}
                        scorableRun={scorableRun}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CompactSteps.displayName = 'CompactSteps';

export { CompactSteps };
