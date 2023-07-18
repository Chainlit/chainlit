import { Box, FormControl, FormHelperText } from '@mui/material';

import InputLabel from 'components/molecules/inputLabel';

type InputStateHandlerProps = {
  children: React.ReactNode;
  description?: string;
  hasError?: boolean;
  id: string;
  label?: string;
  tooltip?: string;
};

export default function InputStateHandler(
  props: InputStateHandlerProps
): JSX.Element {
  const { children, description, hasError, id, label, tooltip } = props;

  return (
    <Box width="100%">
      {label ? <InputLabel id={id} label={label} tooltip={tooltip} /> : null}
      <FormControl error={hasError} fullWidth>
        {children}
        {description ? <FormHelperText>{description}</FormHelperText> : null}
      </FormControl>
    </Box>
  );
}
