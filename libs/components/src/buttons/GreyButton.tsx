import { darkGreyButtonTheme, lightGreyButtonTheme } from 'theme/theme';

import { Button, ButtonProps, ThemeProvider, useTheme } from '@mui/material';

const GreyButton = (props: ButtonProps) => {
  const theme = useTheme();
  const greyTheme =
    theme.palette.mode === 'dark' ? darkGreyButtonTheme : lightGreyButtonTheme;

  return (
    <ThemeProvider theme={greyTheme}>
      <Button {...props} />
    </ThemeProvider>
  );
};

export { GreyButton };
