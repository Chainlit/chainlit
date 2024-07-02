import { useMemo } from 'react';

import Stack from '@mui/material/Stack';

import type { IMessageElement, IStep } from 'client-types/';

import ToolCall from './ToolCall';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  isRunning?: boolean;
}

function groupToolSteps(step: IStep): IStep[][] {
  const groupedSteps: IStep[][] = [];
  let currentGroup: IStep[] = [];

  function processStep(currentStep: IStep) {
    if (currentStep.type === 'tool') {
      if (
        currentGroup.length === 0 ||
        currentGroup[0].name === currentStep.name
      ) {
        currentGroup.push(currentStep);
      } else {
        groupedSteps.push(currentGroup);
        currentGroup = [currentStep];
      }
    } else if (currentStep.steps) {
      // If we haven't found any tools yet, recurse into the steps
      if (groupedSteps.length === 0 && currentGroup.length === 0) {
        for (const childStep of currentStep.steps) {
          processStep(childStep);
        }
      }
    }
  }

  processStep(step);

  // Push the last group if it exists
  if (currentGroup.length > 0) {
    groupedSteps.push(currentGroup);
  }

  return groupedSteps;
}

export default function ToolCalls({ message, elements, isRunning }: Props) {
  const toolCalls = useMemo(() => {
    return message.steps ? groupToolSteps(message) : [];
  }, [message]);

  if (!toolCalls.length) {
    return null;
  }

  return (
    <Stack width="100%" direction="column" gap={1}>
      {toolCalls.map((toolCalls, index) => (
        <ToolCall
          key={index}
          steps={toolCalls}
          elements={elements}
          isRunning={isRunning}
        />
      ))}
    </Stack>
  );
}
