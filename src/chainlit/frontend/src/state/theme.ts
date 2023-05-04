import { atom } from 'recoil';

type ThemeVariant = 'dark' | 'light';

const defaultTheme =
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

const preferredTheme = localStorage.getItem(
  'themeVariant'
) as ThemeVariant | null;

const theme = preferredTheme ? preferredTheme : defaultTheme;

export const themeState = atom<ThemeVariant>({
  key: 'Theme',
  default: theme
});
