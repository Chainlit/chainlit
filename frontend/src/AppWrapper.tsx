import App from 'App';
import { useEffect } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';

import AuthProvider from 'components/atoms/authProvider';

import { useApi } from 'hooks/useApi';

import { IProjectSettings, projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

export default function AppWrapper() {
  const [pSettings, setPSettings] = useRecoilState(projectSettingsState);
  const setAppSettings = useSetRecoilState(settingsState);

  const { data } = useApi<IProjectSettings>(
    pSettings === undefined ? '/project/settings' : null
  );

  useEffect(() => {
    if (!data) return;

    setPSettings(data);
    setAppSettings((prev) => ({
      ...prev,
      defaultCollapseContent: data.ui.default_collapse_content ?? true,
      expandAll: !!data.ui.default_expand_messages,
      hideCot: !!data.ui.hide_cot
    }));
  }, [data]);

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
