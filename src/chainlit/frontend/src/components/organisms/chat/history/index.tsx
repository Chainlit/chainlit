import { memo } from 'react';

import LocalHistoryButton from './local';

interface Props {
  onClick: (content: string) => void;
}

export default memo(function ChatHistory({ onClick }: Props) {
  return <LocalHistoryButton onClick={onClick} />;
});
