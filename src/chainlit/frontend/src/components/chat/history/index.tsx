import LocalHistoryButton from './local';
import { memo } from 'react';

interface Props {
  onClick: (content: string) => void;
}

export default memo(function ChatHistory({ onClick }: Props) {
  return <LocalHistoryButton onClick={onClick} />;
});
