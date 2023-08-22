import { atom } from 'recoil';

type ThemeVariant = 'dark' | 'light';

const defaultTheme = 'light';

const preferredTheme = localStorage.getItem(
  'themeVariant'
) as ThemeVariant | null;

const theme = preferredTheme ? preferredTheme : defaultTheme;

export const settingsState = atom<{
  open: boolean;
  expandAll: boolean;
  hideCot: boolean;
  theme: ThemeVariant;
}>({
  key: 'AppSettings',
  default: {
    open: false,
    expandAll: false,
    hideCot: false,
    theme
  }
});
