import Button, { ButtonProps } from '@mui/material/Button';
import { ThemeProvider, useTheme } from '@mui/material/styles';

import { darkGreyButtonTheme, lightGreyButtonTheme } from '../../theme/theme';

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
