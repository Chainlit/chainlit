import { cn } from '@/lib/utils';
import { ArrowDown } from 'lucide-react';
import {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import { flushSync } from 'react-dom';

import { useChatMessages } from '@chainlit/react-client';

import { Button } from '@/components/ui/button';

interface Props {
  autoScrollUserMessage?: boolean;
  autoScrollAssistantMessage?: boolean;
  autoScrollRef?: MutableRefObject<boolean>;
  children: React.ReactNode;
  className?: string;
}

export default function ScrollContainer({
  autoScrollRef,
  autoScrollUserMessage,
  autoScrollAssistantMessage,
  children,
  className
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const lastUserMessageRef = useRef<HTMLDivElement | null>(null);
  const touchStartY = useRef(0);
  const lastAutoscrollDisabledTime = useRef(0);
  const { messages } = useChatMessages();
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  const isAtBottom = useCallback(() => {
    if (!ref.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = ref.current;
    return scrollTop + clientHeight >= scrollHeight - 10;
  }, []);

  const syncScrollButtonVisibility = useCallback(() => {
    const autoScrollDisabled = autoScrollRef ? !autoScrollRef.current : false;
    flushSync(() => {
      setShowScrollButton(autoScrollDisabled);
    });
  }, [autoScrollRef]);

  // Calculate and update spacer height
  const updateSpacerHeight = useCallback(() => {
    if (!ref.current) return;

    if (autoScrollUserMessage && lastUserMessageRef.current) {
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
      if (afterMessagesHeight === 0 && autoScrollRef?.current !== false) {
        scrollToPosition();
      } else if (autoScrollAssistantMessage && autoScrollRef?.current) {
        ref.current.scrollTop = ref.current.scrollHeight;
      }
    } else if (autoScrollAssistantMessage && autoScrollRef?.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [autoScrollUserMessage, autoScrollAssistantMessage, autoScrollRef]);

  // Find and set a ref to the last user message element
  useEffect(() => {
    if (!ref.current) return;

    if (messages.length === 0 && spacerRef.current) {
      spacerRef.current.style.height = `0px`;
      return;
    }

    // Get all user message elements
    const userMessages = ref.current.querySelectorAll(
      '[data-step-type="user_message"]'
    );
    if (userMessages.length > 0) {
      const lastUserMessage = userMessages[
        userMessages.length - 1
      ] as HTMLDivElement;
      lastUserMessageRef.current = lastUserMessage;
    } else if (lastUserMessageRef.current) {
      lastUserMessageRef.current = null;
    }

    // Update spacer height whether or not there actually is a user message, to make autoscrolling work
    updateSpacerHeight();
  }, [messages, updateSpacerHeight]);

  // Add window resize listener to update spacer height
  useEffect(() => {
    if (!autoScrollUserMessage) return;

    const handleResize = () => {
      updateSpacerHeight();
    };

    window.addEventListener('resize', handleResize);

    // Initial update
    updateSpacerHeight();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [autoScrollUserMessage, updateSpacerHeight]);

  // Add content resize listener to update spacer height
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleContentHeightChange = () => {
      updateSpacerHeight();
      syncScrollButtonVisibility();
    };

    const observer = new ResizeObserver(() => {
      handleContentHeightChange();
    });

    observer.observe(container);

    return () => observer.disconnect();
  }, [
    scrollContainerRef,
    updateSpacerHeight,
    autoScrollRef,
    isScrolling,
    syncScrollButtonVisibility
  ]);

  // On mount, sync the initial scroll-to-bottom button visibility
  useEffect(() => {
    if (!ref.current) return;

    setTimeout(() => {
      if (!ref.current) return;
      syncScrollButtonVisibility();
    }, 500);
  }, [syncScrollButtonVisibility]);

  // Wait for programmatic scrolling to settle, then sync autoscroll state
  const checkScrollEnd = (updateAutoScrollState = true) => {
    if (!ref.current) return;

    const prevScrollTop = ref.current.scrollTop;

    setTimeout(() => {
      if (!ref.current) return;

      const currentScrollTop = ref.current.scrollTop;
      if (currentScrollTop === prevScrollTop) {
        setIsScrolling(false);

        const atBottom = isAtBottom();

        // Only RE-ENABLE autoscroll when at bottom, never disable
        // (disabling is handled by wheel/touch events)
        if (
          updateAutoScrollState &&
          autoScrollRef &&
          atBottom &&
          !autoScrollRef.current
        ) {
          autoScrollRef.current = true;
        }

        syncScrollButtonVisibility();
      } else {
        checkScrollEnd(updateAutoScrollState);
      }
    }, 100);
  };

  // Triggers a smooth scroll to the bottom of the page
  const scrollToBottom = () => {
    if (!ref.current) return;

    setIsScrolling(true);
    ref.current.scrollTo({
      top: ref.current.scrollHeight,
      behavior: 'smooth'
    });

    setShowScrollButton(false);

    if (autoScrollRef) {
      autoScrollRef.current = true;
    }

    checkScrollEnd(false);
  };

  // Triggers a smooth scroll to position the last user message at the
  // top of the container.
  const scrollToPosition = () => {
    if (!ref.current || !lastUserMessageRef.current) return;

    setIsScrolling(true);
    // Scroll to position the last user message at the top with some padding
    const scrollPosition = lastUserMessageRef.current.offsetTop - 20;

    ref.current.scrollTo({
      top: scrollPosition,
      behavior: 'smooth'
    });

    setShowScrollButton(false);
    checkScrollEnd();
  };

  // onScroll event handler - ONLY re-enables autoscroll when at bottom
  // Disabling autoscroll is handled by wheel/touch events to avoid false triggers from content reflow
  const handleScroll = () => {
    if (!ref.current || isScrolling) return;
    if (Date.now() - lastAutoscrollDisabledTime.current < 100) {
      // cooldown period after disabling autoscroll
      return;
    }
    const atBottom = isAtBottom();

    // Only RE-ENABLE autoscroll when user reaches bottom
    // Disabling is handled by handleWheel/handleTouchMove
    if (atBottom && autoScrollRef && !autoScrollRef.current) {
      autoScrollRef.current = true;
      syncScrollButtonVisibility();
    }
  };

  // Handle mouse wheel scroll - disable autoscroll when user scrolls UP
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      // deltaY < 0 means scrolling UP (away from bottom)
      if (e.deltaY < 0 && autoScrollRef?.current) {
        autoScrollRef.current = false;
        lastAutoscrollDisabledTime.current = Date.now();
        syncScrollButtonVisibility();
      }
    },
    [autoScrollRef, syncScrollButtonVisibility, lastAutoscrollDisabledTime]
  );

  // Handle touch start - record initial touch position
  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  // Handle touch move - disable autoscroll when user scrolls toward earlier content
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchStartY.current;

      // Dragging a finger down decreases scrollTop, revealing earlier messages.
      if (deltaY > 10 && autoScrollRef?.current) {
        lastAutoscrollDisabledTime.current = Date.now();
        autoScrollRef.current = false;
        syncScrollButtonVisibility();
      }

      touchStartY.current = currentY;
    },
    [autoScrollRef, syncScrollButtonVisibility, lastAutoscrollDisabledTime]
  );

  // Add wheel and touch event listeners for user scroll detection
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, {
      passive: true
    });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleWheel, handleTouchStart, handleTouchMove]);

  return (
    <div className="relative flex flex-col flex-grow overflow-y-auto">
      <div
        ref={ref}
        className={cn('flex flex-col flex-grow overflow-y-auto', className)}
        onScroll={handleScroll}
      >
        <div ref={scrollContainerRef}>{children}</div>
        {/* Dynamic spacer to position the last user message at the top */}
        <div ref={spacerRef} className="flex-shrink-0" />
      </div>

      <div
        className={cn(
          'absolute bottom-4 left-0 right-0 flex justify-center',
          showScrollButton ? '' : 'hidden'
        )}
      >
        <Button
          size="icon"
          variant="outline"
          className="rounded-full"
          onClick={scrollToBottom}
        >
          <ArrowDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}
