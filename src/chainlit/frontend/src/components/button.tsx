import Button, { ButtonProps } from '@mui/material/Button';

interface Props extends ButtonProps {
  component?: any;
  to?: any;
}

export default function RegularButton({ children, ...props }: Props) {
  return (
    <span>
      <Button
        sx={{
          textTransform: 'none',
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? 'text.primary'
              : theme.palette.primary.main,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? theme.palette.background.paperVariant
              : theme.palette.primary.light,
          '&:hover': {
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? theme.palette.background.paperVariant
                : theme.palette.primary.light
          }
        }}
        {...props}
      >
        {children}
      </Button>
    </span>
  );
}
