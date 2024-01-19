import App from 'App';
import { useAuth } from 'api/auth';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';

import { useApi } from '@chainlit/react-client';

import { apiClientState } from 'state/apiClient';
import { IProjectSettings, projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

export default function AppWrapper() {
  const apiClient = useRecoilValue(apiClientState);
  const [projectSettings, setProjectSettings] =
    useRecoilState(projectSettingsState);
  const setAppSettings = useSetRecoilState(settingsState);
  const { isAuthenticated, isReady } = useAuth();

  const { i18n } = useTranslation();

  const languageInUse = navigator.language || 'en-US';

  function handleChangeLanguage(languageBundle: any): void {
    i18n.addResourceBundle(languageInUse, 'translation', languageBundle);
    i18n.changeLanguage(languageInUse);
  }

  const { data } = useApi<IProjectSettings>(
    apiClient,
    projectSettings === undefined && isAuthenticated
      ? `/project/settings?language=${languageInUse}`
      : null
  );

  if (
    isReady &&
    !isAuthenticated &&
    window.location.pathname !== '/login' &&
    window.location.pathname !== '/login/callback'
  ) {
    window.location.href = '/login';
  }

  useEffect(() => {
    if (!data) return;
    setProjectSettings(data);
    setAppSettings((prev) => ({
      ...prev,
      defaultCollapseContent: data.ui.default_collapse_content ?? true,
      expandAll: !!data.ui.default_expand_messages,
      hideCot: !!data.ui.hide_cot
    }));
    handleChangeLanguage(data.translation);
  }, [data, setProjectSettings, setAppSettings]);

  if (!isReady) {
    return null;
  }

  return <App />;
}
