import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';
import { MutableRefObject, useEffect, useRef, useState } from 'react';

import { useChatMessages } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

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
  const [showScrollButton, setShowScrollButton] = useState(false);

  const scrollToBottom = () => {
    if (!ref.current) return;

    ref.current.scrollTo({
      top: ref.current.scrollHeight,
      behavior: 'instant'
    });

    if (autoScrollRef) {
      autoScrollRef.current = true;
    }

    setShowScrollButton(false);
  };

  useEffect(() => {
    if (!ref.current || !autoScrollRef?.current) {
      return;
    }
    ref.current.scrollTop = ref.current.scrollHeight;
  }, [messages]);

  const handleScroll = () => {
    if (!ref.current) return;

    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (autoScrollRef) {
      autoScrollRef.current = atBottom;
    }

    setShowScrollButton(!atBottom);
  };

  return (
    <div className="relative flex flex-col flex-grow overflow-y-auto">
      <div
        ref={ref}
        className={cn('flex flex-col flex-grow overflow-y-auto', className)}
        onScroll={handleScroll}
      >
        {children}
      </div>
      {showScrollButton ? (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <Button
            size="icon"
            variant="outline"
            className="rounded-full"
            onClick={scrollToBottom}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
