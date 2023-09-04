import { useRecoilState } from 'recoil';

import { Alert } from '@mui/material';

import Toggle from 'components/atoms/toggle';

import { modeState } from 'state/playground';

import { PromptMode } from 'types/playground';

interface Props {
  hasTemplate?: boolean;
}
export default function PromptModeToggle({ hasTemplate }: Props) {
  const [mode, setMode] = useRecoilState(modeState);

  if (mode === 'Template' && !hasTemplate) {
    setMode('Formatted');
    return null;
  }

  return hasTemplate ? (
    <Toggle
      label={'View'}
      id="toggle-prompt-mode"
      value={mode}
      items={['Template', 'Formatted']}
      onChange={(v) => setMode(v as PromptMode)}
    />
  ) : (
    <Alert sx={{ alignSelf: 'flex-end' }} severity="info" id="template-warning">
      Prompt template not found. Only displaying formatted prompt instead.
    </Alert>
  );
}
