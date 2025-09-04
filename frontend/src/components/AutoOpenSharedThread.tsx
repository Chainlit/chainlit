import { useEffect } from 'react';

import { useChatSession } from '@chainlit/react-client';

type Props = {
  id: string;
  shareToken?: string;
};

export default function AutoOpenSharedThread({ id, shareToken }: Props) {
  const { session } = useChatSession();

  useEffect(() => {
    const socket = session?.socket;
    if (!socket || !id) return;

    const emitOpen = () => {
      socket.emit('open_shared_thread', {
        threadId: id,
        ...(shareToken ? { shareToken } : {})
      });
    };

    if (socket.connected) {
      emitOpen();
    } else {
      socket.once('connect', emitOpen);
      return () => {
        socket.off('connect', emitOpen);
      };
    }
  }, [session?.socket, id, shareToken]);

  return null;
}
