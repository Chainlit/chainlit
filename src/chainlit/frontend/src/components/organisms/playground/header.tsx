import { Stack } from '@mui/material';

import PromptModeToggle from './modeToggle';
import SaveButton from './saveButton';
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
        <SaveButton hasTemplate={hasTemplate} />
      </Stack>
    </Stack>
  );
}
