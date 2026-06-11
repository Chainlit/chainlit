
import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function applyThemeVariables(variant: 'dark' | 'light') {
  // Protection SSR
  if (typeof window === 'undefined') return;

  // @ts-ignore - window.theme est injectÃ© par Chainlit
  if (!window.theme) return;

  // @ts-ignore
  const variables = window.theme[variant];
  if (!variables) return;

  const root = window.document.documentElement;

  // Apply new theme variables
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value as string);
  });
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  // 1. Initialisation sÃ»re pour le SSR (sans localStorage immÃ©diat)
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // 2. RÃ©cupÃ©ration du thÃ¨me depuis localStorage uniquement cÃ´tÃ© client (aprÃ¨s le montage)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey) as Theme;
      if (stored) {
        setTheme(stored);
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      root.classList.add(systemTheme);
      applyThemeVariables(systemTheme);
      return;
    } else {
      applyThemeVariables(theme);
    }

    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem(storageKey, newTheme);
      }
      setTheme(newTheme);
    }
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  // 3. Protection SSR pour matchMedia
  let systemTheme: 'dark' | 'light' = 'light'; // Valeur par dÃ©faut pour le serveur

  if (typeof window !== 'undefined') {
    systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }

  const variant = context.theme === 'system' ? systemTheme : context.theme;

  return { ...context, variant };
};