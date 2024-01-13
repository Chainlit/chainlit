import { atom } from 'recoil';

type ThemeVariant = 'dark' | 'light';

export type Language = 'en-US' | 'pt-BR';

const defaultTheme = 'light';

const preferredTheme = localStorage.getItem(
  'themeVariant'
) as ThemeVariant | null;

const theme = preferredTheme ? preferredTheme : defaultTheme;

export const defaultSettingsState = {
  open: false,
  defaultCollapseContent: true,
  expandAll: false,
  hideCot: false,
  isChatHistoryOpen: true,
  language: 'en-US' as Language,
  theme
};

export const settingsState = atom<{
  open: boolean;
  defaultCollapseContent: boolean;
  expandAll: boolean;
  hideCot: boolean;
  theme: ThemeVariant;
  isChatHistoryOpen: boolean;
  language: Language;
}>({
  key: 'AppSettings',
  default: defaultSettingsState
});
