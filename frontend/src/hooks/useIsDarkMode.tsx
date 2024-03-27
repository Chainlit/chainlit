import useTheme from '@mui/material/styles/useTheme';

const useIsDarkMode = (): boolean => {
  const theme = useTheme();

  return theme.palette.mode === 'dark';
};

export { useIsDarkMode };
