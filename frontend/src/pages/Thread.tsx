import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  threadHistoryState,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import Page from 'pages/Page';
import Chat from '@/components/chat';
import { ReadOnlyThread } from '@/components/ReadOnlyThread';
import AutoResumeThread from '@/components/AutoResumeThread';
import { Loader } from '@/components/Loader';

export default function ThreadPage() {
  const { id } = useParams();
  const { config } = useConfig();

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
      {config?.threadResumable ?       <AutoResumeThread id={id!} /> : null}
      {config?.threadResumable ? isCurrentThread ?
      <Chat /> : <div className='flex flex-grow items-center justify-center'><Loader className='!size-6' /></div>
    :  <ReadOnlyThread id={id!} />}
      </>
    </Page>
  );
}
