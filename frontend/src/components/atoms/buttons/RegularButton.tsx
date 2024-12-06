import { grey } from 'theme/palette';

import Button, { ButtonProps } from '@mui/material/Button';

interface Props extends ButtonProps {
  component?: any;
  to?: any;
}

const RegularButton = ({ children, ...props }: Props) => {
  return (
    <span>
      <Button
        sx={{
          textTransform: 'none',
          color: (theme) =>
            theme.palette.mode === 'dark'
              ? 'text.primary'
              : theme.palette.primary.contrastText,
          background: (theme) =>
            theme.palette.mode === 'dark'
              ? grey[700]
              : theme.palette.primary.light,
          '&:hover': {
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? grey[700]
                : theme.palette.primary.light
          }
        }}
        {...props}
      >
        {children}
      </Button>
    </span>
  );
};

export { RegularButton };
