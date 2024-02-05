import Button, { ButtonProps } from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

function AccentButton({
  children,
  ...props
}: ButtonProps & { target?: string }) {
  const theme = useTheme();
  const buttonStyle = {
    //By Jay 5/2/2024
    border: 'none' // Set border to none to remove it
  };
  return (
    <span style={{ color: theme.palette.text.primary }}>
      <Button
        color={theme.palette.mode === 'dark' ? 'inherit' : 'primary'}
        style={buttonStyle} //By Jay 5/2/2024
        {...props}
      >
        {children}
      </Button>
    </span>
  );
}

export { AccentButton };
