import getRouterBasename from '@/lib/router';
import App from 'App';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  useApi,
  useAuth,
  useChatInteract,
  useConfig
} from '@chainlit/react-client';


export default function AppWrapper() {
  const [translationLoaded, setTranslationLoaded] = useState(false);
  const { isAuthenticated, isReady } = useAuth();
  const { language: languageInUse } = useConfig();
  const { i18n } = useTranslation();
  const { windowMessage } = useChatInteract();

  async function loadTranslation(language: string) {
    try {
      const translation = await import(`../../translations/${languageInUse}.json`);
      i18n.addResourceBundle(language, 'translation', translation);
      i18n.changeLanguage(language);
      setTranslationLoaded(true)
    } catch (error) {
      console.error(
        `Could not load translation for language: ${language}`,
        error
      );
    }
  }

  useEffect(() => {
    loadTranslation(languageInUse);
  }, []);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      windowMessage(event.data);
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [windowMessage]);

  if (!translationLoaded) return null;

  if (
    isReady &&
    !isAuthenticated &&
    window.location.pathname !== getRouterBasename() + '/login' &&
    window.location.pathname !== getRouterBasename() + '/login/callback'
  ) {
    window.location.href = getRouterBasename() + '/login';
  }
  return <App />;
}
