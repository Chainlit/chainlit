import { darkGreyButtonTheme, lightGreyButtonTheme } from 'theme/theme';

import Button, { ButtonProps } from '@mui/material/Button';
import ThemeProvider from '@mui/material/styles/ThemeProvider';
import useTheme from '@mui/material/styles/useTheme';

const GreyButton = ({ sx, ...props }: ButtonProps) => {
  const theme = useTheme();
  const greyTheme =
    theme.palette.mode === 'dark' ? darkGreyButtonTheme : lightGreyButtonTheme;

  return (
    <ThemeProvider theme={greyTheme}>
      <Button
        {...props}
        disableElevation
        disableRipple
        sx={{
          ...sx,
          textTransform: 'none'
        }}
      />
    </ThemeProvider>
  );
};

export { GreyButton };
