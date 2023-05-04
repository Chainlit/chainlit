import { useAuth } from 'hooks/auth';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import LocalHistoryButton from './local';
import CloudHistoryButton from './cloud';
import { memo } from 'react';

interface Props {
  onClick: (content: string) => void;
}

export default memo(function ChatHistory({ onClick }: Props) {
  const { isAuthenticated } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);

  if (isAuthenticated && pSettings?.projectId) {
    return <CloudHistoryButton onClick={onClick} />;
  } else {
    return <LocalHistoryButton onClick={onClick} />;
  }
});
