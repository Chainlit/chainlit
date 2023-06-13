import App from 'App';
import { getProjectSettings } from 'api';
import AuthProvider from 'components/authProvider';
import { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { projectSettingsState } from 'state/project';

export default function AppWrapper() {
  const [pSettings, setPSettings] = useRecoilState(projectSettingsState);

  useEffect(() => {
    if (pSettings === undefined) {
      getProjectSettings().then((res) => {
        setPSettings(res);
      });
    }
  }, []);

  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}
