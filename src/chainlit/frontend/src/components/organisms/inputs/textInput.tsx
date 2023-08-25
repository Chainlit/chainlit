import { TextField, TextFieldProps } from '@mui/material';

import { IInput } from 'types/Input';

import InputStateHandler from './inputStateHandler';

export type TextInputProps = {
  value?: string;
  placeholder?: string;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  TextFieldProps;

export default function TextInput({
  description,
  disabled,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  multiline,
  sx,
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
        multiline={multiline}
        inputProps={{
          ...rest,
          id: id,
          name: id,
          sx: {
            height: size === 'small' ? '7px' : '15px',
            minHeight: multiline ? '100px' : 'auto'
          }
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
