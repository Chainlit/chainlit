import Conversation from 'components/dataset';
import Page from 'pages/Page';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';

export default function Dataset() {
  const pSettings = useRecoilValue(projectSettingsState);
  if (!pSettings?.project?.database) {
    return null;
  }

  return (
    <Page>
      <Conversation />
    </Page>
  );
}
