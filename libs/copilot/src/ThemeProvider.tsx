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
  if (!window.theme) return;

  const variables = window.theme[variant];
  if (!variables) return;

  const shadowContainer = window.cl_shadowRootElement;
  if (!shadowContainer) return;

  // Apply new theme variables
  Object.entries(variables).forEach(([key, value]) => {
    shadowContainer.style.setProperty(key, value);
  });
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const shadowContainer = window.cl_shadowRootElement;
    if (!shadowContainer) return;

    // Remove existing theme classes
    shadowContainer.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light';

      shadowContainer.classList.add(systemTheme);
      applyThemeVariables(systemTheme);
      return;
    }

    shadowContainer.classList.add(theme);
    applyThemeVariables(theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      const shadowContainer = window.cl_shadowRootElement;
      if (!shadowContainer) return;

      const newTheme = mediaQuery.matches ? 'dark' : 'light';
      shadowContainer.classList.remove('light', 'dark');
      shadowContainer.classList.add(newTheme);
      applyThemeVariables(newTheme);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
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

  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  const variant = context.theme === 'system' ? systemTheme : context.theme;

  return { ...context, variant };
};
