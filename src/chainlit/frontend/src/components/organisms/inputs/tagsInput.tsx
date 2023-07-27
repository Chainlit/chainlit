import { MuiChipsInput, MuiChipsInputChip } from 'mui-chips-input';

import { IInput } from 'types/Input';

import InputStateHandler from './inputStateHandler';

type TagsInput = {
  placeholder?: string;
  value?: string[];
  onChange?: (value: MuiChipsInputChip[]) => void;
} & IInput;

export default function TagsInput({
  description,
  disabled,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  ...rest
}: TagsInput): JSX.Element {
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <MuiChipsInput {...rest} size={size} />
    </InputStateHandler>
  );
}
