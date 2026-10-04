import { useEffect } from 'react';
import { useRecoilValue } from 'recoil';

import Page from 'pages/Page';

import {
  unavailableThreadIdState,
  useChatInteract
} from '@chainlit/react-client';

import Chat from '@/components/chat';

export default function Home() {
  const unavailableThreadId = useRecoilValue(unavailableThreadIdState);
  const { clear } = useChatInteract();

  useEffect(() => {
    if (unavailableThreadId) clear();
  }, [unavailableThreadId, clear]);

  return (
    <Page>
      <Chat />
    </Page>
  );
}
