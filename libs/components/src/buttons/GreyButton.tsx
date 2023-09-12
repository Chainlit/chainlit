import { darkGreyButtonTheme, lightGreyButtonTheme } from 'theme/theme';

import { Button, ButtonProps } from '@mui/material';
import { ThemeProvider, useTheme } from '@mui/material/styles';

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
