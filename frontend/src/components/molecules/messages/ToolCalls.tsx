import { useMemo } from 'react';

import Stack from '@mui/material/Stack';

import type { IMessageElement, IStep } from 'client-types/';

import ToolCall from './ToolCall';

interface Props {
  message: IStep;
  elements: IMessageElement[];
  isRunning?: boolean;
}

export default function ToolCalls({ message, elements, isRunning }: Props) {
  const toolCalls = useMemo(() => {
    return message.steps ? message.steps.filter((s) => s.type === 'tool') : [];
  }, [message]);

  if (!toolCalls.length) {
    return null;
  }

  return (
    <Stack width="100%" direction="column" gap={1}>
      <ToolCall steps={toolCalls} elements={elements} isRunning={isRunning} />
    </Stack>
  );
}
