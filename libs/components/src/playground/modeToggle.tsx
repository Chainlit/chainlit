import { PlaygroundContext } from 'contexts/PlaygroundContext';
import { useContext } from 'react';
import { Toggle } from 'src/buttons';

import Tooltip from '@mui/material/Tooltip';

import { PromptMode } from 'src/types/playground';

interface Props {
  hasTemplate?: boolean;
}
export default function PromptModeToggle({ hasTemplate }: Props) {
  const { setPromptMode, promptMode } = useContext(PlaygroundContext);
  const disabled = !hasTemplate;

  const toggle = (
    <Toggle
      disabled={disabled}
      label={'View'}
      id="toggle-prompt-mode"
      value={promptMode}
      items={['Template', 'Formatted']}
      onChange={(v) => setPromptMode(v as PromptMode)}
    />
  );

  if (disabled) {
    return (
      <Tooltip title="Prompt template not found. Only displaying formatted prompt instead.">
        <span>{toggle}</span>
      </Tooltip>
    );
  } else {
    return toggle;
  }
}
