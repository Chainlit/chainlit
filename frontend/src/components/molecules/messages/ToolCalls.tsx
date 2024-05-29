import { useMemo } from 'react';

import Stack from '@mui/material/Stack';

import type { IMessageElement, IStep } from 'client-types/';

import ToolCall from './ToolCall';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  isRunning?: boolean;
}

function groupToolSteps(step: IStep) {
  const groupedSteps: IStep[][] = [];

  let currentGroup: IStep[] = [];

  function traverseAndGroup(currentStep: IStep) {
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
    }

    if (currentStep.steps) {
      for (const childStep of currentStep.steps) {
        traverseAndGroup(childStep);
      }
    }
  }

  traverseAndGroup(step);

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
      {toolCalls.map((toolCall, index) => (
        <ToolCall
          key={index}
          steps={toolCall}
          elements={elements}
          isRunning={isRunning}
        />
      ))}
    </Stack>
  );
}
