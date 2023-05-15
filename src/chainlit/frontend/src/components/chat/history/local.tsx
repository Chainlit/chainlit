import HistoryButton from './button';
import useLocalChatHistory from 'hooks/localChatHistory';
import { useState } from 'react';

interface Props {
  onClick: (content: string) => void;
}

export default function LocalHistoryButton({ onClick }: Props) {
  const { getLocalChatHistory } = useLocalChatHistory();
  const [chats, setChats] = useState(getLocalChatHistory());
  return (
    <HistoryButton
      onClick={onClick}
      onOpen={() => setChats(getLocalChatHistory())}
      chats={chats}
    />
  );
}
