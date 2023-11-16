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
  IConversationsFilters,
  accessTokenState,
  conversationsHistoryState
} from '@chainlit/react-client';

import { conversationsFiltersState } from 'state/conversations';
import { projectSettingsState } from 'state/project';
import { settingsState } from 'state/settings';

import { ConversationsHistoryList } from './ConversationsHistoryList';
import Filters from './filters';

const DRAWER_WIDTH = 260;
const BATCH_SIZE = 20;

let _scrollTop = 0;

const _ConversationsHistorySidebar = () => {
  const isMobile = useMediaQuery('(max-width:66rem)');

  const [conversations, setConversations] = useRecoilState(
    conversationsHistoryState
  );
  const accessToken = useRecoilValue(accessTokenState);
  const filters = useRecoilValue(conversationsFiltersState);
  const [settings, setSettings] = useRecoilState(settingsState);

  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [prevFilters, setPrevFilters] =
    useState<IConversationsFilters>(filters);
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

  const fetchConversations = async (cursor?: string | number) => {
    try {
      if (cursor) {
        setIsLoadingMore(true);
      } else {
        setIsFetching(true);
      }
      const { pageInfo, data } = await apiClient.getConversations(
        { first: BATCH_SIZE, cursor },
        filters,
        accessToken
      );
      setError(undefined);

      // Prevent conversations to be duplicated
      const allConversations = uniqBy(
        // We should only concatenate conversations when we have a cursor indicating that we have loaded more items.
        cursor ? conversations?.conversations?.concat(data) : data,
        'id'
      );

      if (allConversations) {
        setConversations((prev) => ({
          ...prev,
          pageInfo: pageInfo,
          conversations: allConversations
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

  if (accessToken && !isFetching && !conversations?.conversations && !error) {
    fetchConversations();
  }

  if (conversations?.pageInfo) {
    const { hasNextPage, endCursor } = conversations.pageInfo;

    if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
      fetchConversations(endCursor);
    }
  }

  if (filtersHasChanged) {
    setPrevFilters(filters);
    fetchConversations();
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
            Chat History
          </Typography>
          <IconButton edge="end" onClick={() => setChatHistoryOpen(false)}>
            <KeyboardDoubleArrowLeftIcon sx={{ color: 'text.primary' }} />
          </IconButton>
        </Stack>
        <Filters />
        {conversations ? (
          <ConversationsHistoryList
            conversations={conversations}
            error={error}
            isFetching={isFetching}
            isLoadingMore={isLoadingMore}
            fetchConversations={fetchConversations}
          />
        ) : null}
      </Drawer>
    </>
  );
};

const ConversationsHistorySidebar = () => {
  const { user } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);

  if (!pSettings?.dataPersistence || !user) {
    return null;
  }

  return <_ConversationsHistorySidebar />;
};

export { ConversationsHistorySidebar };
