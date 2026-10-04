import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';

import Page from 'pages/Page';

import {
  threadHistoryState,
  unavailableThreadIdState,
  useChatInteract,
  useChatMessages,
  useConfig
} from '@chainlit/react-client';

import AutoResumeThread from '@/components/AutoResumeThread';
import { Loader } from '@/components/Loader';
import { ReadOnlyThread } from '@/components/ReadOnlyThread';
import Chat from '@/components/chat';

export default function ThreadPage() {
  const { id } = useParams();
  const location = useLocation();
  const { config } = useConfig();

  const setThreadHistory = useSetRecoilState(threadHistoryState);

  const { threadId } = useChatMessages();

  const isCurrentThread = threadId === id;
  const unavailableThreadId = useRecoilValue(unavailableThreadIdState);
  const isUnavailableThread = !!id && unavailableThreadId === id;
  const { clear } = useChatInteract();

  useEffect(() => {
    if (!id && unavailableThreadId) clear();
  }, [id, unavailableThreadId, clear]);

  useEffect(() => {
    setThreadHistory((prev) => {
      if (prev?.currentThreadId === id) return prev;
      return { ...prev, currentThreadId: id };
    });
  }, [id]);

  const isSharedRoute = location.pathname.startsWith('/share/');

  return (
    <Page>
      <>
        {isSharedRoute || isUnavailableThread ? (
          <ReadOnlyThread id={id!} />
        ) : null}
        {config?.threadResumable &&
        !isCurrentThread &&
        !isSharedRoute &&
        !isUnavailableThread ? (
          <AutoResumeThread id={id!} />
        ) : null}
        {config?.threadResumable && !isSharedRoute && !isUnavailableThread ? (
          isCurrentThread ? (
            <Chat />
          ) : (
            <div className="flex flex-grow items-center justify-center">
              <Loader className="!size-6" />
            </div>
          )
        ) : null}
        {config &&
        !config.threadResumable &&
        !isSharedRoute &&
        !isUnavailableThread ? (
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
