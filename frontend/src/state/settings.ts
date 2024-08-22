import { atom } from 'recoil';

type ThemeVariant = 'dark' | 'light';

const defaultTheme = (window.theme?.default || 'dark') as ThemeVariant;

const preferredTheme = localStorage.getItem(
  'themeVariant'
) as ThemeVariant | null;

const theme = preferredTheme ? preferredTheme : defaultTheme;

export const defaultSettingsState = {
  open: false,
  defaultCollapseContent: true,
  isChatHistoryOpen: true,
  language: 'en-US',
  theme
};

export const settingsState = atom<{
  open: boolean;
  theme: ThemeVariant;
  isChatHistoryOpen: boolean;
  language: string;
}>({
  key: 'AppSettings',
  default: defaultSettingsState
});
