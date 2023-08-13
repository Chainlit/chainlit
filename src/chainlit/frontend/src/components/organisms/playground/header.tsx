import { Stack } from '@mui/material';

import CommitButton from './commitButton';
import PromptModeToggle from './modeToggle';
import VariableInput from './variableInput';

interface Props {
  hasTemplate?: boolean;
}

export default function PlaygroundHeader({ hasTemplate }: Props) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between">
      <Stack direction="row" alignItems="center" gap={1}>
        <PromptModeToggle hasTemplate={hasTemplate} />
        <VariableInput />
      </Stack>
      <Stack direction="row" alignItems="center" gap={1}>
        <CommitButton hasTemplate={hasTemplate} />
      </Stack>
    </Stack>
  );
}
