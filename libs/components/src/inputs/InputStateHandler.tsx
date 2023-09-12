import { FormControl, FormHelperText, Stack, SxProps } from '@mui/material';

import { IInput } from 'src/types/Input';

import { InputLabel } from './InputLabel';

type InputStateHandlerProps = {
  children: React.ReactNode;
  sx?: SxProps;
} & IInput;

const InputStateHandler = (props: InputStateHandlerProps): JSX.Element => {
  const {
    children,
    description,
    hasError,
    id,
    label,
    notificationsProps,
    tooltip,
    sx
  } = props;

  return (
    <Stack width="100%" sx={sx} gap={0.5}>
      {label ? (
        <InputLabel
          id={id}
          label={label}
          tooltip={tooltip}
          notificationsProps={notificationsProps}
        />
      ) : null}
      <FormControl error={hasError} fullWidth>
        {children}
        {description ? <FormHelperText>{description}</FormHelperText> : null}
      </FormControl>
    </Stack>
  );
};

export { InputStateHandler };
export type { InputStateHandlerProps };
