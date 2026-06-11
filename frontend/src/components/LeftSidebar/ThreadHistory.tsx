
import { uniqBy } from 'lodash';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  ChainlitContext,
  threadHistoryState,
  useChatMessages,
  ThreadHistory as TThreadHistory
} from '@chainlit/react-client';

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu
} from '@/components/ui/sidebar';

import { ThreadList } from './ThreadList';

const BATCH_SIZE = 35;
let _scrollTop = 0;

// Re-groupe les threads par date en heure locale
function groupThreadsByLocalDate(threads: any[]): Record<string, any[]> {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOf7Days = new Date(startOfToday);
  startOf7Days.setDate(startOf7Days.getDate() - 7);
  const startOf30Days = new Date(startOfToday);
  startOf30Days.setDate(startOf30Days.getDate() - 30);

  const groups: Record<string, any[]> = {};

  for (const thread of threads) {
    const date = new Date(thread.createdAt);
    let group: string;

    if (date >= startOfToday) {
      group = 'Today';
    } else if (date >= startOfYesterday) {
      group = 'Yesterday';
    } else if (date >= startOf7Days) {
      group = 'Previous 7 days';
    } else if (date >= startOf30Days) {
      group = 'Previous 30 days';
    } else {
      // Grouper par mois/annÃ©e pour les plus anciens
      group = date.toLocaleDateString(navigator.language, {
        month: 'long',
        year: 'numeric'
      });
    }

    if (!groups[group]) groups[group] = [];
    groups[group].push(thread);
  }

  return groups;
}

export function ThreadHistory() {
  const router = useNavigate();
  const pathname = useLocation().pathname;
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiClient = useContext(ChainlitContext);
  const { firstInteraction, messages, threadId } = useChatMessages();
  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const [error, setError] = useState<string>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const prevMessageCountRef = useRef(0);

  // Re-grouper avec l'heure locale et injecter dans threadHistory
  const localThreadHistory = useMemo<TThreadHistory | undefined>(() => {
    if (!threadHistory?.threads) return threadHistory;
    const localGroups = groupThreadsByLocalDate(threadHistory.threads);
    return {
      ...threadHistory,
      timeGroupedThreads: localGroups,
    };
  }, [threadHistory]);

  // Restore scroll position
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = _scrollTop;
    }
  }, []);

  // Handle first interaction
  useEffect(() => {
    const handleFirstInteraction = async () => {
      if (!firstInteraction) return;

      const isActualResume =
        firstInteraction === 'resume' &&
        messages[0]?.output.toLowerCase() !== 'resume';

      if (isActualResume) return;

      await fetchThreads(undefined, true);

      if (threadId && pathname === '/chat') {
        navigate(`/thread/${threadId}`);
      }
    };

    handleFirstInteraction();
  }, [firstInteraction, threadId, pathname, router]);

  // Reorder thread to top when a new message is sent
  useEffect(() => {
    const currentCount = messages.length;
    const prevCount = prevMessageCountRef.current;
    prevMessageCountRef.current = currentCount;

    if (
      threadId &&
      currentCount > prevCount &&
      prevCount > 0 &&
      threadHistory?.threads
    ) {
      const lastMessage = messages[currentCount - 1];
      if (lastMessage?.type === 'user_message') {
        setThreadHistory((prev) => {
          if (!prev?.threads) return prev;
          const threadIndex = prev.threads.findIndex((t) => t.id === threadId);
          if (threadIndex <= 0) return prev;
          const updatedThreads = [...prev.threads];
          updatedThreads[threadIndex] = {
            ...updatedThreads[threadIndex],
            createdAt: new Date().toISOString()
          };
          return { ...prev, threads: updatedThreads };
        });
      }
    }
  }, [messages.length, threadId]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollHeight, clientHeight, scrollTop } = scrollRef.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;
    _scrollTop = scrollTop;
    setShouldLoadMore(atBottom);
  };

  const fetchThreads = async (
    cursor?: string | number,
    isLoadingMore = false
  ) => {
    try {
      setIsLoadingMore(!!cursor || isLoadingMore);
      setIsFetching(!cursor && !isLoadingMore);

      const { pageInfo, data } = await apiClient.listThreads(
        { first: BATCH_SIZE, cursor },
        {}
      );

      setError(undefined);

      const allThreads = uniqBy(
        cursor ? threadHistory?.threads?.concat(data) : data,
        'id'
      );

      if (allThreads) {
        setThreadHistory((prev) => ({
          ...prev,
          pageInfo,
          threads: allThreads
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setShouldLoadMore(false);
      setIsLoadingMore(false);
      setIsFetching(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (!isFetching && !threadHistory?.threads && !error) {
      fetchThreads();
    }
  }, [isFetching, threadHistory, error]);

  // Infinite scroll
  useEffect(() => {
    if (threadHistory?.pageInfo) {
      const { hasNextPage, endCursor } = threadHistory.pageInfo;
      if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
        fetchThreads(endCursor);
      }
    }
  }, [shouldLoadMore, isLoadingMore, threadHistory]);

  return (
    <SidebarContent onScroll={handleScroll} ref={scrollRef}>
      <SidebarGroup>
        <SidebarMenu>
          {localThreadHistory ? (
            <div id="thread-history" className="flex-grow">
              <ThreadList
                threadHistory={localThreadHistory}
                error={error}
                isFetching={isFetching}
                isLoadingMore={isLoadingMore}
              />
            </div>
          ) : null}
        </SidebarMenu>
      </SidebarGroup>
    </SidebarContent>
  );
}