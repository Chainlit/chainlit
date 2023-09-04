import { Box, TextField, Theme, Typography, useTheme } from '@mui/material';

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
      const contentWidth = count.toString().length * 8 + (hasArrow ? 18 : 0);
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
            '&::-webkit-inner-spin-button, &::-webkit-outer-spin-button': {
              display: 'none'
            },
            '&:focus': {
              width: getInputWidth(true),
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
