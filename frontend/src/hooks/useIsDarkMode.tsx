import { useTheme } from '@mui/material';

export default function useIsDarkMode(): boolean {
  const theme = useTheme();

  return theme.palette.mode === 'dark';
}
