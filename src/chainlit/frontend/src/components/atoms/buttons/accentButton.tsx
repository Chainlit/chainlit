import { useTheme } from '@mui/material';
import Button, { ButtonProps } from '@mui/material/Button';

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
