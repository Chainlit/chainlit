import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';

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
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const { messages } = useChatMessages();
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Calculate and update spacer height
  const updateSpacerHeight = useCallback(() => {
    if (!ref.current || !lastUserMessageRef.current) return;

    const containerHeight = ref.current.clientHeight;
    const lastMessageHeight = lastUserMessageRef.current.offsetHeight;

    // Calculate the height of all elements after the last user message
    let afterMessagesHeight = 0;
    let currentElement = lastUserMessageRef.current.nextElementSibling;

    // Iterate through all siblings after the last user message
    while (currentElement && currentElement !== spacerRef.current) {
      afterMessagesHeight += (currentElement as HTMLElement).offsetHeight;
      currentElement = currentElement.nextElementSibling;
    }

    // Position the last user message at the top with some padding
    // Subtract both the message height and the height of any messages after it
    const newSpacerHeight =
      containerHeight - lastMessageHeight - afterMessagesHeight - 32;

    // Only set a positive spacer height
    if (spacerRef.current) {
      spacerRef.current.style.height = `${Math.max(0, newSpacerHeight)}px`;
    }

    // Scroll to position the message at the top
    if (afterMessagesHeight === 0) {
      scrollToPosition();
    } else if (autoScrollRef?.current) {
      if (ref.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    }
  }, [autoScrollRef]);

  // Find and set a ref to the last user message element
  useEffect(() => {
    if (!ref.current) return;

    // Get all message elements
    const userMessages = ref.current.querySelectorAll(
      '[data-step-type="user_message"]'
    );
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[
        userMessages.length - 1
      ] as HTMLDivElement;
      lastUserMessageRef.current = lastUserMessage;

      // Update spacer height when last user message is found
      updateSpacerHeight();
    }
  }, [messages, updateSpacerHeight]);

  // Add window resize listener to update spacer height
  useEffect(() => {
    const handleResize = () => {
      updateSpacerHeight();
    };

    window.addEventListener('resize', handleResize);

    // Initial update
    updateSpacerHeight();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [updateSpacerHeight]);

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

  const scrollToPosition = () => {
    if (!ref.current || !lastUserMessageRef.current) return;

    // Scroll to position the last user message at the top with some padding
    const scrollPosition = lastUserMessageRef.current.offsetTop - 20;

    ref.current.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });
  };

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
        {/* Dynamic spacer to position the last user message at the top */}
        <div ref={spacerRef} className="flex-shrink-0" />
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
