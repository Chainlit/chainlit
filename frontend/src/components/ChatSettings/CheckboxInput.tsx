import { IInput } from '@/types';
import * as React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

import { InputStateHandler } from './InputStateHandler';

interface CheckboxInputProps extends IInput {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  setField?: (field: string, value: boolean, shouldValidate?: boolean) => void;
}

const CheckboxInput = ({
  id,
  hasError,
  description,
  label,
  tooltip,
  checked,
  disabled,
  onChange,
  setField
}: CheckboxInputProps): JSX.Element => {
  return (
    <InputStateHandler
      id={id}
      hasError={hasError}
      description={description}
      tooltip={tooltip}
    >
      <div className="flex items-center gap-2">
        <Checkbox
          id={id}
          checked={checked}
          disabled={disabled}
          onCheckedChange={(checked) => {
            onChange(!!checked);
            setField?.(id, !!checked);
          }}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <label
                htmlFor={id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {label}
              </label>
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </InputStateHandler>
  );
};

export { CheckboxInput };
export type { CheckboxInputProps };
