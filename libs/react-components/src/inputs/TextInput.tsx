import TextField, { TextFieldProps } from '@mui/material/TextField';

import { IInput } from 'src/types/Input';

import { InputStateHandler } from './InputStateHandler';

type TextInputProps = {
  value?: string;
  placeholder?: string;
  endAdornment?: React.ReactNode;
} & IInput &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> &
  Pick<TextFieldProps, 'multiline'>;

const TextInput = ({
  description,
  disabled,
  hasError,
  id,
  label,
  size = 'small',
  tooltip,
  multiline,
  endAdornment,
  ...rest
}: TextInputProps): JSX.Element => {
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
        InputProps={{ endAdornment }}
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
        multiline={multiline}
        sx={{
          fontSize: '14px',
          fontWeight: 400,
          my: 0.5
        }}
      />
    </InputStateHandler>
  );
};

export { TextInput };
export type { TextInputProps };
