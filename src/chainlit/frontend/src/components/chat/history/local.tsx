import { useCallback } from 'react';
import HistoryButton from './button';
import useLocalChatHistory from 'hooks/localChatHistory';

interface Props {
  onClick: (content: string) => void;
}

export default function LocalHistoryButton({ onClick }: Props) {
  const { getLocalChatHistory } = useLocalChatHistory();
  const chats = getLocalChatHistory();
  const onOpen = useCallback(() => {
    return getLocalChatHistory();
  }, []);
  return <HistoryButton onClick={onClick} onOpen={onOpen} chats={chats} />;
}
