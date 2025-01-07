import { cn } from '@/lib/utils';
import { useEffect, useRef } from 'react';

import { useChatMessages, useChatSession } from '@chainlit/react-client';

interface Props {
  setAutoScroll?: (autoScroll: boolean) => void;
  autoScroll?: boolean;
  children: React.ReactNode;
  className?: string;
}

export default function ScrollContainer({
  setAutoScroll,
  autoScroll,
  children,
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
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
    <div
      ref={ref}
      className={cn(
        'relative flex flex-col flex-grow overflow-y-auto',
        className
      )}
      onScroll={handleScroll}
    >
      {children}
    </div>
  );
}
