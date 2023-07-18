import { useState } from 'react';

import useLocalChatHistory from 'hooks/localChatHistory';

import HistoryButton from './button';

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
