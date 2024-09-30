import { useEffect, useRef } from 'react';

import { Box } from '@mui/material';

import { useChatMessages, useChatSession } from '@chainlit/react-client';

interface Props {
  setAutoScroll?: (autoScroll: boolean) => void;
  autoScroll?: boolean;
  children: React.ReactNode;
}

export default function ScrollContainer({
  setAutoScroll,
  autoScroll,
  children
}: Props) {
  const ref = useRef<HTMLDivElement>();
  const { messages } = useChatMessages();
  const { session } = useChatSession();

  useEffect(() => {
    setAutoScroll?.(true);
  }, [session?.socket.id]);

  useEffect(() => {
    if (!ref.current || !autoScroll) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages, autoScroll]);

  const handleScroll = () => {
    if (!ref.current || !setAutoScroll) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    setAutoScroll(atBottom);
  };

  return (
    <Box
      ref={ref}
      position="relative"
      display="flex"
      flexDirection="column"
      flexGrow={1}
      sx={{
        overflowY: 'auto'
      }}
      onScroll={handleScroll}
    >
      {children}
    </Box>
  );
}
