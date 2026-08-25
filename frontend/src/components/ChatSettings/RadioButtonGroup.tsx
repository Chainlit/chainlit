import { IInput } from '@/types';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { InputStateHandler } from './InputStateHandler';

interface RadioItemType {
  label: string;
  value: string;
}

interface RadioButtonGroupProps extends IInput {
  items?: RadioItemType[];
  value?: string;
  onChange: (value: string) => void;
  setField?: (field: string, value: string, shouldValidate?: boolean) => void;
}

const RadioButtonGroup = ({
  id,
  hasError,
  description,
  label,
  tooltip,
  items = [],
  value,
  disabled = false,
  onChange,
  setField
}: RadioButtonGroupProps): JSX.Element => {
  return (
    <InputStateHandler
      id={id}
      hasError={hasError}
      description={description}
      label={label}
      tooltip={tooltip}
    >
      <RadioGroup
        value={value}
        disabled={disabled}
        onValueChange={(v: string) => {
          onChange(v);
          setField?.(id, v);
        }}
      >
        {items.map((item) => (
          <div key={item.value} className="flex items-center space-x-2">
            <RadioGroupItem
              value={item.value}
              id={item.value}
              disabled={disabled}
              className="peer"
            />
            <Label htmlFor={item.value}>{item.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </InputStateHandler>
  );
};

export { RadioButtonGroup };
export type { RadioButtonGroupProps };
