import { MuiChipsInput } from 'mui-chips-input';

import { IInput } from 'types/Input';

import InputStateHandler from './inputStateHandler';

export type TagsInputProps = {
  placeholder?: string;
  value?: string[];
  setField?(field: string, value: string[], shouldValidate?: boolean): void;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>;

export default function TagsInput({
  description,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  setField,
  ...rest
}: TagsInputProps): JSX.Element {
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <MuiChipsInput
        {...rest}
        size={size}
        onChange={(value) => setField?.(id, value, false)}
        inputProps={{
          id: id,
          name: id
        }}
      />
    </InputStateHandler>
  );
}
