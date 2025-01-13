import { uniqBy } from 'lodash';
import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import {
  ChainlitContext,
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';

import {
  SidebarContent,
  SidebarGroup,
  SidebarMenu
} from '@/components/ui/sidebar';

import { ThreadList } from './ThreadList';

const BATCH_SIZE = 35;
let _scrollTop = 0;

export function ThreadHistory() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const apiClient = useContext(ChainlitContext);
  const { firstInteraction, messages, threadId } = useChatMessages();
  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const [error, setError] = useState<string>();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);

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

      const currentPage = new URL(window.location.href);
      if (threadId && currentPage.pathname === '/') {
        navigate(`/thread/${threadId}`);
      }
    };

    handleFirstInteraction();
  }, [firstInteraction]);

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

      // Prevent duplicate threads
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

  // Handle infinite scroll
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
          {threadHistory ? (
            <div className="flex-grow">
              <ThreadList
                threadHistory={threadHistory}
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
