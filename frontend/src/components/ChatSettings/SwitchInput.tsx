import { cn } from '@/lib/utils';
import * as React from 'react';

import { Switch } from '@/components/ui/switch';

import { InputStateHandler } from './InputStateHandler';

interface InputStateProps {
  description?: string;
  hasError?: boolean;
  id: string;
  label?: string;
  tooltip?: string;
  children: React.ReactNode;
}

interface SwitchInputProps extends InputStateProps {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  setField?: (field: string, value: boolean, shouldValidate?: boolean) => void;
}

const SwitchInput = ({
  checked,
  description,
  disabled,
  hasError,
  id,
  label,
  setField,
  tooltip
}: SwitchInputProps): JSX.Element => {
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <Switch
        id={id}
        checked={checked}
        disabled={disabled}
        onCheckedChange={(checked) => {
          setField?.(id, checked);
        }}
        className={cn(
          'data-[state=checked]:bg-primary',
          hasError && 'border-destructive'
        )}
      />
    </InputStateHandler>
  );
};

export { SwitchInput };
export type { SwitchInputProps };
