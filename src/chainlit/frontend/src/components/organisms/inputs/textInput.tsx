import { TextField } from '@mui/material';

import { IInput } from 'types/Input';

import InputStateHandler from './inputStateHandler';

export type TextInputProps = {
  value?: string;
  placeholder?: string;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>;

export default function TextInput({
  description,
  disabled,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  ...rest
}: TextInputProps): JSX.Element {
  return (
    <InputStateHandler
      description={description}
      hasError={hasError}
      id={id}
      label={label}
      tooltip={tooltip}
    >
      <TextField
        disabled={disabled}
        inputProps={{
          ...rest,
          id: id,
          name: id,
          sx: { height: size === 'small' ? '7px' : '15px' }
        }}
        fullWidth
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          my: 0.5
        }}
      />
    </InputStateHandler>
  );
}
