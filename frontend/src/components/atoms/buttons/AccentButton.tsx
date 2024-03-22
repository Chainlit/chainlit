import Button, { ButtonProps } from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

function AccentButton({
  children,
  ...props
}: ButtonProps & { target?: string }) {
  const theme = useTheme();
  return (
    <span style={{ color: theme.palette.text.primary }}>
      <Button
        color={theme.palette.mode === 'dark' ? 'inherit' : 'primary'}
        {...props}
      >
        {children}
      </Button>
    </span>
  );
}

export { AccentButton };
