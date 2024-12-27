import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';

import Page from 'pages/Page';
import Chat from '@/components/chat';
import { PersistedThread } from '@/components/PersistedThread';

export default function ThreadPage() {
  const { id } = useParams();

  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);

  const { threadId } = useChatMessages();

  const isCurrentThread = threadId === id;

  useEffect(() => {
    if (threadHistory?.currentThreadId !== id) {
      setThreadHistory((prev) => {
        return { ...prev, currentThreadId: id };
      });
    }
  }, [id]);

  return (
    <Page>
      <>
        {isCurrentThread && <Chat />}
        {!isCurrentThread && id && (
          <PersistedThread id={id} />
        )}
      </>
    </Page>
  );
}
