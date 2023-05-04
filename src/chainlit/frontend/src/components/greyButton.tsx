import { ThemeProvider } from '@mui/material/styles';
import { greyButtonTheme } from 'theme';
import Button, { ButtonProps } from '@mui/material/Button';

export default function GreyButton(props: ButtonProps) {
  return (
    <ThemeProvider theme={greyButtonTheme}>
      <Button {...props} />
    </ThemeProvider>
  );
}
