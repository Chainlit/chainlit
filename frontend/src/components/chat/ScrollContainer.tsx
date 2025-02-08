import { cn } from '@/lib/utils';
import { MutableRefObject, useEffect, useRef } from 'react';

import { useChatMessages } from '@chainlit/react-client';

interface Props {
  autoScrollRef?: MutableRefObject<boolean>;
  children: React.ReactNode;
  className?: string;
}

export default function ScrollContainer({
  autoScrollRef,
  children,
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { messages } = useChatMessages();

  useEffect(() => {
    if (!ref.current || !autoScrollRef?.current) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    if (!ref.current || !autoScrollRef) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    autoScrollRef.current = atBottom;
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
