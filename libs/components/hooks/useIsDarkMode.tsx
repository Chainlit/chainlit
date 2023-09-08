import { useTheme } from '@mui/material';

const useIsDarkMode = (): boolean => {
  const theme = useTheme();

  return theme.palette.mode === 'dark';
};

export { useIsDarkMode };
