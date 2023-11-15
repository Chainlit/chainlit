import type { Theme } from '@mui/material';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useTheme from '@mui/material/styles/useTheme';

import { NotificationCountProps } from './types/NotificationCount';

const NotificationCount = ({
  count,
  inputProps
}: NotificationCountProps): JSX.Element | null => {
  const theme = useTheme();

  if (!count) return null;

  const renderBox = () => (
    <Box
      display="flex"
      alignItems="center"
      className="notification-count"
      sx={{
        borderRadius: '6px',
        padding: '4px 8px',
        backgroundColor:
          theme.palette.mode === 'light' ? 'grey.100' : 'grey.800'
      }}
    >
      <Typography
        className="notification-count"
        color="text.secondary"
        sx={{
          fontSize: '12px',
          fontWeight: 600
        }}
      >
        {count}
      </Typography>
    </Box>
  );

  const renderInput = () => {
    const getInputWidth = (hasArrow?: boolean) => {
      const countString = count.toString();
      let contentWidth = countString.length * 8 + (hasArrow ? 22 : 0);
      if (countString.includes('.') || countString.includes(','))
        contentWidth -= 6;
      return `${contentWidth}px`;
    };

    return inputProps ? (
      <TextField
        id={inputProps.id}
        inputProps={{
          type: 'number',
          max: inputProps.max,
          min: inputProps.min,
          step: inputProps.step || 1,
          sx: {
            width: getInputWidth(),
            padding: (theme: Theme) => theme.spacing(0.5, 1),
            fontSize: '12px',
            fontWeight: 600,
            color: 'text.secondary',
            MozAppearance: 'textfield',
            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
              display: 'none'
            },
            '&:focus': {
              width: getInputWidth(true),
              MozAppearance: 'auto',
              '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
                display: 'flex'
              }
            }
          }
        }}
        sx={{
          borderRadius: '6px',
          backgroundColor: (theme: Theme) =>
            theme.palette.mode === 'light' ? 'grey.100' : 'grey.800',
          '& fieldset': { border: 'none' }
        }}
        value={count}
        onChange={inputProps.onChange}
      />
    ) : null;
  };

  return !inputProps ? renderBox() : renderInput();
};

export { NotificationCount };
