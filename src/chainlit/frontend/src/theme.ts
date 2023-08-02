import { grey, primary, white } from 'palette';

import { createTheme } from '@mui/material/styles';

type Primary = {
  dark?: string;
  light?: string;
  main?: string;
};

type Theme = {
  primary?: Primary;
  background?: string;
  paper?: string;
};

declare global {
  interface Window {
    theme?: {
      light?: Theme;
      dark?: Theme;
    };
  }
}

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
  },
  MuiFormHelperText: {
    defaultProps: {
      sx: {
        m: 0,
        fontWeight: 400,
        color: grey[500]
      }
    }
  }
};

const shape = {
  borderRadius: 8
};

const success = {
  main: 'rgba(25, 195, 125, 1)',
  contrastText: white
};
const error = {
  main: 'rgba(239, 65, 70, 1)',
  contrastText: white
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
      default: window?.theme?.dark?.background || grey[850],
      paper: window?.theme?.dark?.paper || grey[900]
    },
    primary: {
      main: window?.theme?.dark?.primary?.main || '#F80061',
      dark: window?.theme?.dark?.primary?.dark || primary[800],
      light: window?.theme?.dark?.primary?.light || '#FFE7EB',
      contrastText: white
    },
    secondary: {
      main: '#9757D7',
      dark: '#763FB8',
      light: '#B87FE7',
      contrastText: white
    },
    divider: grey[800],
    text: {
      primary: grey[200],
      secondary: grey[400]
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
      default: window?.theme?.light?.background || grey[50],
      paper: window?.theme?.light?.paper || white
    },
    primary: {
      main: window?.theme?.light?.primary?.main || '#F80061',
      dark: window?.theme?.light?.primary?.dark || primary[800],
      light: window?.theme?.light?.primary?.light || '#FFE7EB',
      contrastText: white
    },
    secondary: {
      main: '#9757D7',
      dark: '#763FB8',
      light: '#B87FE7',
      contrastText: white
    },
    divider: grey[200],
    text: {
      primary: grey[900],
      secondary: grey[700]
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
      main: grey[700],
      contrastText: grey[100]
    }
  }
});

export const lightGreyButtonTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    primary: {
      main: grey[200],
      contrastText: grey[700]
    }
  }
});

export default makeTheme;
