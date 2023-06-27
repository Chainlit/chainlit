import { createTheme } from '@mui/material/styles';

const typography = {
  fontFamily: ['Inter', 'sans-serif'].join(',')
};

const components = {
  MuiButton: {
    defaultProps: {
      disableElevation: true,
      disableRipple: true,
      sx: {
        textTransform: 'none'
      }
    }
  },
  MuiLink: {
    defaultProps: {
      fontWeight: 500
    }
  }
};

const shape = {
  borderRadius: 8
};

const success = {
  main: 'rgba(25, 195, 125, 1)',
  contrastText: '#fff'
};
const error = {
  main: 'rgba(239, 65, 70, 1)',
  contrastText: '#fff'
};

declare module '@mui/material/styles' {
  interface TypeBackground {
    paperVariant: string;
  }
}

const darkTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    mode: 'dark',
    success,
    error,
    background: {
      default: '#303030',
      paperVariant: '#616161',
      paper: '#212121'
    },
    primary: {
      main: '#F80061',
      dark: '#980039',
      light: '#FFE7EB',
      contrastText: '#F5F5F5'
    },
    secondary: {
      main: '#9757D7',
      dark: '#763FB8',
      light: '#B87FE7',
      contrastText: '#fff'
    },
    divider: '#424242',
    text: {
      primary: '#EEEEEE',
      secondary: '#BDBDBD'
    }
  }
});

const lightTheme = createTheme({
  typography,
  components: components,
  shape,
  palette: {
    mode: 'light',
    success,
    error,
    background: {
      default: '#FAFAFA',
      paperVariant: '#EEEEEE',
      paper: '#FFF'
    },
    primary: {
      main: '#F80061',
      dark: '#980039',
      light: '#FFE7EB',
      contrastText: '#303030'
    },
    secondary: {
      main: '#9757D7',
      dark: '#763FB8',
      light: '#B87FE7',
      contrastText: '#fff'
    },
    divider: '#EEEEEE',
    text: {
      primary: '#212121',
      secondary: '#616161'
    }
  }
});

const makeTheme = (variant: 'dark' | 'light') =>
  variant === 'dark' ? darkTheme : lightTheme;

export const darkGreyButtonTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    primary: {
      main: '#616161',
      contrastText: '#F5F5F5'
    }
  }
});

export const lightGreyButtonTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    primary: {
      main: '#EEEEEE',
      contrastText: '#616161'
    }
  }
});

export default makeTheme;
