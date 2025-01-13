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
        return '...';
      }

      return t(path, options);
    },
    ready,
    i18n
  };
};

export default Translator;
