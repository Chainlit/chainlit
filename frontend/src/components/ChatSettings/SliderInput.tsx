import { cn } from '@/lib/utils';

import { Slider } from '@/components/ui/slider';

import { InputStateHandler } from './InputStateHandler';

interface IInput {
  description?: string;
  hasError?: boolean;
  id: string;
  label?: string;
  tooltip?: string;
}

interface SliderInputProps extends IInput {
  value?: number;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number[];
  onValueChange?: (value: number[]) => void;
  setField?: (field: string, value: number, shouldValidate?: boolean) => void;
  className?: string;
}

const SliderInput = ({
  description,
  hasError,
  id,
  label,
  tooltip,
  value,
  min = 0,
  max = 100,
  step = 1,
  defaultValue = [0],
  onValueChange,
  setField,
  className,
  ...props
}: SliderInputProps) => {
  const handleValueChange = (newValue: number[]) => {
    const parsedValue = newValue[0];

    if (max && parsedValue > max) {
      setField?.(id, max);
    } else if (min && parsedValue < min) {
      setField?.(id, min);
    } else {
      onValueChange?.(newValue);
      setField?.(id, parsedValue);
    }
  };

  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
      notificationsProps={{
        showBadge: true,
        count: value || 0
      }}
    >
      <Slider
        id={id}
        name={id}
        max={max}
        min={min}
        step={step}
        value={value !== undefined ? [value] : defaultValue}
        onValueChange={handleValueChange}
        className={cn('w-full', className)}
        {...props}
      />
    </InputStateHandler>
  );
};

export { SliderInput };
export type { SliderInputProps };
