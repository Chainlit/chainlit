import { BreakpointsOptions } from '@mui/material';
import createTheme from '@mui/material/styles/createTheme';

import { green, grey, primary, white } from './palette';

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
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        backgroundColor: 'black'
      }
    }
  }
};

const shape = {
  borderRadius: 8
};

const success = {
  main: green[500],
  contrastText: white
};
const error = {
  main: 'rgba(239, 65, 70, 1)',
  contrastText: white
};

const darkTheme = (fontFamily?: string, breakpoints?: BreakpointsOptions) =>
  createTheme({
    typography: fontFamily ? { fontFamily } : typography,
    components,
    shape,
    breakpoints: breakpoints,
    palette: {
      mode: 'dark',
      success,
      error,
      background: {
        default: grey[850],
        paper: grey[900]
      },
      primary: {
        main: '#F80061',
        dark: primary[800],
        light: '#FFE7EB',
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

const lightTheme = (fontFamily?: string, breakpoints?: BreakpointsOptions) =>
  createTheme({
    typography: fontFamily ? { fontFamily } : typography,
    components,
    shape,
    breakpoints: breakpoints,
    palette: {
      mode: 'light',
      success,
      error,
      background: {
        default: grey[50],
        paper: white
      },
      primary: {
        main: '#F80061',
        dark: primary[800],
        light: '#FFE7EB',
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

const makeTheme = (
  variant: 'dark' | 'light',
  fontFamily?: string,
  breakpoints?: BreakpointsOptions
) =>
  variant === 'dark'
    ? darkTheme(fontFamily, breakpoints)
    : lightTheme(fontFamily, breakpoints);

const darkGreyButtonTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    primary: {
      main: grey[900]
    }
  }
});

const lightGreyButtonTheme = createTheme({
  typography,
  components,
  shape,
  palette: {
    primary: {
      main: grey[200]
    }
  }
});

// Maybe we should not export dark and light theme button from the package
export { makeTheme, darkGreyButtonTheme, lightGreyButtonTheme };
