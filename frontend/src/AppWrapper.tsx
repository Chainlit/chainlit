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
  const { language } = useConfig();
  const { i18n } = useTranslation();
  const { windowMessage } = useChatInteract();

  function handleChangeLanguage(languageBundle: any): void {
    i18n.addResourceBundle(language, 'translation', languageBundle);
    i18n.changeLanguage(language);
  }

  const { data: translations } = useApi<any>(
    `/project/translations?language=${language}`
  );

  useEffect(() => {
    if (!translations) return;
    console.log('Loading translations for language:', language);
    handleChangeLanguage(translations.translation);
    setTranslationLoaded(true);
  }, [translations, language]);

  // Reset translation loaded state when language changes
  useEffect(() => {
    console.log(`Language changed to: ${language}`);
    setTranslationLoaded(false);
  }, [language]);

  // Initialize i18n language from stored language preference
  useEffect(() => {
    if (language && i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language, i18n]);

  // Add a timeout fallback to prevent indefinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!translationLoaded) {
        console.warn('Translation loading timeout, proceeding without translations');
        setTranslationLoaded(true);
      }
    }, 5000); // 5 second timeout
    
    return () => clearTimeout(timer);
  }, [translationLoaded, language]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      windowMessage(event.data);
    };
    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, [windowMessage]);

  // Only block rendering if translations are not loaded and not on login-related pages
  // For login pages, we can proceed even without translations loaded
  const isLoginPage = window.location.pathname === getRouterBasename() + '/login' || 
                     window.location.pathname === getRouterBasename() + '/login/callback';
  
  if (!translationLoaded && !isLoginPage) {
    return null;
  }

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
