import Button, { ButtonProps } from '@mui/material/Button';
import { useTheme } from '@mui/material';

export default function AccentButton({ children, ...props }: ButtonProps) {
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
