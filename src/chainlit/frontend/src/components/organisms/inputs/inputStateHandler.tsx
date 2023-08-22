import { FormControl, FormHelperText, Stack, SxProps } from '@mui/material';

import InputLabel from 'components/molecules/inputLabel';

import { IInput } from 'types/Input';

export type InputStateHandlerProps = {
  children: React.ReactNode;
  sx?: SxProps;
} & IInput;

export default function InputStateHandler(
  props: InputStateHandlerProps
): JSX.Element {
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
}
