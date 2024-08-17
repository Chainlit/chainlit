import App from 'App';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useApi, useAuth, useConfig } from '@chainlit/react-client';

export default function AppWrapper() {
  const { isReady } = useAuth();
  const { language: languageInUse } = useConfig();
  const { i18n } = useTranslation();

  function handleChangeLanguage(languageBundle: any): void {
    i18n.addResourceBundle(languageInUse, 'translation', languageBundle);
    i18n.changeLanguage(languageInUse);
  }

  const { data: translations } = useApi<any>(
    `/project/translations?language=${languageInUse}`
  );

  useEffect(() => {
    if (!translations) return;
    handleChangeLanguage(translations.translation);
  }, [translations]);

  if (!isReady) {
    return null;
  }

  return <App />;
}
