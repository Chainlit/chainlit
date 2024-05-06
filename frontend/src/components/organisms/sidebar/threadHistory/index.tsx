import isEqual from 'lodash/isEqual';
import uniqBy from 'lodash/uniqBy';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';

import { Box } from '@mui/material';

import {
  IThreadFilters,
  accessTokenState,
  threadHistoryState,
  useChatMessages
} from '@chainlit/react-client';

import { apiClientState } from 'state/apiClient';
import { threadsFiltersState } from 'state/threads';

import { ThreadList } from './ThreadList';
import Filters from './filters';

const BATCH_SIZE = 20;

let _scrollTop = 0;

export function ThreadHistory() {
  const filters = useRecoilValue(threadsFiltersState);
  const ref = useRef<HTMLDivElement>(null);
  const [prevFilters, setPrevFilters] = useState<IThreadFilters>(filters);

  const filtersHasChanged = !isEqual(prevFilters, filters);
  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const accessToken = useRecoilValue(accessTokenState);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const apiClient = useRecoilValue(apiClientState);
  const { firstInteraction, messages, threadId } = useChatMessages();
  const navigate = useNavigate();

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = _scrollTop;
    }
  }, []);

  useEffect(() => {
    if (!firstInteraction) {
      return;
    }

    // distinguish between the first interaction containing the word "resume"
    // and the actual resume message
    const isActualResume =
      firstInteraction === 'resume' &&
      messages.at(0)?.output.toLowerCase() !== 'resume';

    if (isActualResume) {
      return;
    }

    fetchThreads(undefined, true).then(() => {
      const currentPage = new URL(window.location.href);
      if (threadId && currentPage.pathname === '/') {
        navigate(`/thread/${threadId}`);
      }
    });
  }, [firstInteraction]);

  const handleScroll = () => {
    if (!ref.current) return;

    const { scrollHeight, clientHeight, scrollTop } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    //We save the scroll top in order to scroll to the element when the page is changing.
    _scrollTop = scrollTop;

    setShouldLoadMore(atBottom);
  };

  const fetchThreads = async (
    cursor?: string | number,
    isLoadingMore?: boolean
  ) => {
    try {
      if (cursor || isLoadingMore) {
        setIsLoadingMore(true);
      } else {
        setIsFetching(true);
      }
      const { pageInfo, data } = await apiClient.listThreads(
        { first: BATCH_SIZE, cursor },
        filters,
        accessToken
      );
      setError(undefined);

      // Prevent threads to be duplicated
      const allThreads = uniqBy(
        // We should only concatenate threads when we have a cursor indicating that we have loaded more items.
        cursor ? threadHistory?.threads?.concat(data) : data,
        'id'
      );

      if (allThreads) {
        setThreadHistory((prev) => ({
          ...prev,
          pageInfo: pageInfo,
          threads: allThreads
        }));
      }
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setShouldLoadMore(false);
      setIsLoadingMore(false);
      setIsFetching(false);
    }
  };

  if (accessToken && !isFetching && !threadHistory?.threads && !error) {
    fetchThreads();
  }

  if (threadHistory?.pageInfo) {
    const { hasNextPage, endCursor } = threadHistory.pageInfo;

    if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
      fetchThreads(endCursor);
    }
  }

  if (filtersHasChanged) {
    setPrevFilters(filters);
    fetchThreads();
  }

  return (
    <>
      <Filters />
      {threadHistory ? (
        <Box
          sx={{ flexGrow: 1, overflow: 'auto' }}
          onScroll={handleScroll}
          ref={ref}
        >
          <ThreadList
            threadHistory={threadHistory}
            error={error}
            isFetching={isFetching}
            isLoadingMore={isLoadingMore}
            fetchThreads={fetchThreads}
          />
        </Box>
      ) : null}
    </>
  );
}
