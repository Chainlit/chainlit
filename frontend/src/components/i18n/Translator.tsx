import { TOptions } from 'i18next';
import { $Dictionary } from 'i18next/typescript/helpers';
import { useTranslation as usei18nextTranslation } from 'react-i18next';

import { Skeleton } from '@/components/ui/skeleton';

type options = TOptions<$Dictionary>;

type TranslatorProps = {
  path: string | string[];
  suffix?: string;
  options?: options;
};

const Translator = ({ path, options, suffix }: TranslatorProps) => {
  const { t, i18n } = usei18nextTranslation();

  if (!i18n.exists(path, options)) {
    // Provide fallbacks for common login form fields
    const fallbacks: Record<string, string> = {
      'auth.login.form.username.label': 'Username',
      'auth.login.form.username.required': 'Username is required',
      'auth.login.form.password.label': 'Password',
      'auth.login.form.password.required': 'Password is required',
      'auth.login.form.actions.signin': 'Sign In',
      'auth.login.title': 'Login to access the app',
      'auth.login.form.alternativeText.or': 'OR'
    };
    
    const pathString = Array.isArray(path) ? path[0] : path;
    if (fallbacks[pathString]) {
      return <span>{fallbacks[pathString]}{suffix}</span>;
    }
    
    return <Skeleton className="h-4 w-10" />;
  }

  return (
    <span>
      {t(path, options)}
      {suffix}
    </span>
  );
};

export const useTranslation = () => {
  const { t, ready, i18n } = usei18nextTranslation();

  return {
    t: (path: string | string[], options?: options) => {
      if (!i18n.exists(path, options)) {
        // Provide fallbacks for common paths
        const fallbacks: Record<string, string> = {
          'auth.login.form.username.required': 'Username is required',
          'auth.login.form.password.required': 'Password is required',
          'auth.login.errors.default': 'Unable to sign in',
          'auth.login.form.username.label': 'Username',
          'auth.login.form.password.label': 'Password',
          'auth.login.form.actions.signin': 'Sign In',
          'auth.login.title': 'Login to access the app',
          'auth.login.form.alternativeText.or': 'OR'
        };
        
        const pathString = Array.isArray(path) ? path[0] : path;
        if (fallbacks[pathString]) {
          return fallbacks[pathString];
        }
        
        // If it's an array of paths, try each one
        if (Array.isArray(path)) {
          for (const p of path) {
            if (i18n.exists(p, options)) {
              return t(p, options);
            }
            if (fallbacks[p]) {
              return fallbacks[p];
            }
          }
        }
        
        return '...';
      }

      return t(path, options);
    },
    ready,
    i18n
  };
};

export default Translator;
