import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import LocalHistoryButton from './local';
import CloudHistoryButton from './cloud';
import { memo } from 'react';

interface Props {
  onClick: (content: string) => void;
}

export default memo(function ChatHistory({ onClick }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);

  if (!pSettings?.project?.public) {
    return <CloudHistoryButton onClick={onClick} />;
  } else {
    return <LocalHistoryButton onClick={onClick} />;
  }
});
