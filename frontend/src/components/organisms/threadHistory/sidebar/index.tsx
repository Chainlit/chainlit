import { apiClient } from 'api';
import { useAuth } from 'api/auth';
import isEqual from 'lodash/isEqual';
import uniqBy from 'lodash/uniqBy';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import {
  IThreadFilters,
  accessTokenState,
  threadHistoryState
} from '@chainlit/react-client';

import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';
import { threadsFiltersState } from 'state/threads';

import { ThreadList } from './ThreadList';
import Filters from './filters';

const DRAWER_WIDTH = 260;
const BATCH_SIZE = 20;

let _scrollTop = 0;

const _ThreadHistorySideBar = () => {
  const isMobile = useMediaQuery('(max-width:66rem)');

  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);
  const accessToken = useRecoilValue(accessTokenState);
  const filters = useRecoilValue(threadsFiltersState);
  const [settings, setSettings] = useRecoilState(settingsState);

  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [prevFilters, setPrevFilters] = useState<IThreadFilters>(filters);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const ref = useRef<HTMLDivElement>(null);
  const filtersHasChanged = !isEqual(prevFilters, filters);

  const handleScroll = () => {
    if (!ref.current) return;

    const { scrollHeight, clientHeight, scrollTop } = ref.current;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    //We save the scroll top in order to scroll to the element when the page is changing.
    _scrollTop = scrollTop;

    setShouldLoadMore(atBottom);
  };

  const fetchThreads = async (cursor?: string | number) => {
    try {
      if (cursor) {
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

  const setChatHistoryOpen = (open: boolean) =>
    setSettings((prev) => ({ ...prev, isChatHistoryOpen: open }));

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = _scrollTop;
    }

    if (isMobile) {
      setChatHistoryOpen(false);
    }
  }, []);

  return (
    <>
      <Drawer
        className="chat-history-drawer"
        anchor="left"
        open={settings.isChatHistoryOpen}
        variant={isMobile ? 'temporary' : 'persistent'}
        hideBackdrop={!isMobile}
        onClose={() => setChatHistoryOpen(false)}
        PaperProps={{
          ref: ref,
          onScroll: handleScroll
        }}
        sx={{
          width: settings.isChatHistoryOpen ? 'auto' : 0,
          '& .MuiDrawer-paper': {
            width: settings.isChatHistoryOpen ? DRAWER_WIDTH : 0,
            position: 'inherit',
            gap: 1,
            display: 'flex',
            padding: '0px 4px',
            backgroundImage: 'none'
          }
        }}
      >
        <Stack
          sx={{
            px: 2,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1.5
          }}
        >
          <Typography
            sx={{
              fontSize: 16,
              fontWeight: 600,
              color: (theme) => theme.palette.text.primary
            }}
          >
            Past Chats
          </Typography>
          <IconButton edge="end" onClick={() => setChatHistoryOpen(false)}>
            <KeyboardDoubleArrowLeftIcon sx={{ color: 'text.primary' }} />
          </IconButton>
        </Stack>
        <Filters />
        {threadHistory ? (
          <ThreadList
            threadHistory={threadHistory}
            error={error}
            isFetching={isFetching}
            isLoadingMore={isLoadingMore}
            fetchThreads={fetchThreads}
          />
        ) : null}
      </Drawer>
    </>
  );
};

const ThreadHistorySideBar = () => {
  const { user } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);

  if (!pSettings?.dataPersistence || !user) {
    return null;
  }

  return <_ThreadHistorySideBar />;
};

export { ThreadHistorySideBar };
