import { MuiChipsInput } from 'mui-chips-input';

import { IInput } from 'src/types/Input';

import { InputStateHandler } from './InputStateHandler';

type TagsInputProps = {
  placeholder?: string;
  value?: string[];
  setField?(field: string, value: string[], shouldValidate?: boolean): void;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'color'>;

const TagsInput = ({
  description,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  setField,
  ...rest
}: TagsInputProps): JSX.Element => (
  <InputStateHandler
    description={description}
    hasError={hasError}
    id={id}
    label={label}
    tooltip={tooltip}
  >
    <MuiChipsInput
      {...rest}
      sx={{ my: 0.5 }}
      size={size}
      onChange={(value: string[]) => setField?.(id, value, false)}
      inputProps={{
        id: id,
        name: id
      }}
    />
  </InputStateHandler>
);

export { TagsInput };
export type { TagsInputProps };
