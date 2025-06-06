import { useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import Page from 'pages/Page';

import {
  threadHistoryState,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import AutoResumeThread from '@/components/AutoResumeThread';
import { Loader } from '@/components/Loader';
import { ReadOnlyThread } from '@/components/ReadOnlyThread';
import Chat from '@/components/chat';

export default function ThreadPage() {
  const { id } = useParams();
  const { config } = useConfig();
  const threadHistory = useRecoilValue(threadHistoryState);

  const setThreadHistory = useSetRecoilState(threadHistoryState);

  const { threadId } = useChatMessages();

  // Get the most recent thread ID from the thread history
  const mostRecentThreadId = useMemo(() => {
    if (!threadHistory?.threads?.length) return null;

    // Sort threads by createdAt in descending order
    const sortedThreads = [...threadHistory.threads].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return sortedThreads[0]?.id;
  }, [threadHistory?.threads]);

  const isCurrentThread = threadId === id;

  const currentIsMostRecent = threadId === mostRecentThreadId;

  useEffect(() => {
    setThreadHistory((prev) => {
      if (prev?.currentThreadId === id) return prev;
      return { ...prev, currentThreadId: id };
    });
  }, [id]);

  return (
    <Page>
      <>
        {id ? <AutoResumeThread id={id} /> : null}
        {config?.threadResumable ? (
          isCurrentThread ? (
            currentIsMostRecent ? (
              <Chat />
            ) : (
              <ReadOnlyThread id={id!} />
            )
          ) : (
            <div className="flex flex-grow items-center justify-center">
              <Loader className="!size-6" />
            </div>
          )
        ) : null}
        {config && !config.threadResumable ? (
          isCurrentThread ? (
            currentIsMostRecent ? (
              <Chat />
            ) : (
              <ReadOnlyThread id={id!} />
            )
          ) : (
            <ReadOnlyThread id={id!} />
          )
        ) : null}
      </>
    </Page>
  );
}
