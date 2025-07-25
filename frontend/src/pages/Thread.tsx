import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import Page from 'pages/Page';

import {
  useAuthStore,
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

  const threadHistory = useAuthStore((state) => state.threadHistory);
  const setThreadHistory = useAuthStore((state) => state.setThreadHistory);

  const { threadId } = useChatMessages();

  const isCurrentThread = threadId === id;

  useEffect(() => {
    if (threadHistory?.currentThreadId === id) return;
    setThreadHistory({ currentThreadId: id });
  }, [id]);

  return (
    <Page>
      <>
        {config?.threadResumable && !isCurrentThread ? (
          <AutoResumeThread id={id!} />
        ) : null}
        {config?.threadResumable ? (
          isCurrentThread ? (
            <Chat />
          ) : (
            <div className="flex flex-grow items-center justify-center">
              <Loader className="!size-6" />
            </div>
          )
        ) : null}
        {config && !config.threadResumable ? (
          isCurrentThread ? (
            <Chat />
          ) : (
            <ReadOnlyThread id={id!} />
          )
        ) : null}
      </>
    </Page>
  );
}
