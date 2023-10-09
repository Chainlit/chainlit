import { ChainlitAPI } from 'api/chainlitApi';
import { uniqBy } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';

import KeyboardDoubleArrowLeftIcon from '@mui/icons-material/KeyboardDoubleArrowLeft';
import KeyboardDoubleArrowRightIcon from '@mui/icons-material/KeyboardDoubleArrowRight';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';

import { useAuth } from 'hooks/auth';

import {
  IConversationsFilters,
  conversationsFiltersState,
  conversationsHistoryState
} from 'state/conversations';
import { projectSettingsState } from 'state/project';
import { accessTokenState } from 'state/user';

import { ConversationsHistoryList } from './ConversationsHistoryList';
import Filters from './filters';

const DRAWER_WIDTH = 260;
const BATCH_SIZE = 20;

let _scrollTop = 0;

const _ConversationsHistorySidebar = () => {
  const isMobile = useMediaQuery('(max-width:800px)');

  const [conversations, setConversations] = useRecoilState(
    conversationsHistoryState
  );
  const accessToken = useRecoilValue(accessTokenState);
  const filters = useRecoilValue(conversationsFiltersState);

  const [open, setOpen] = useState(true);
  const [shouldLoadMore, setShouldLoadMore] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [prevFilters, setPrevFilters] =
    useState<IConversationsFilters>(filters);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const ref = useRef<HTMLDivElement>(null);

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
      const { pageInfo, data } = await ChainlitAPI.getConversations(
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

  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = _scrollTop;
    }
  }, []);

  useEffect(() => {
    const filtersHasChanged =
      JSON.stringify(prevFilters) !== JSON.stringify(filters);

    if (filtersHasChanged) {
      setPrevFilters(filters);
      fetchConversations();
    }
  }, [filters]);

  useEffect(() => {
    if (!isFetching && !conversations?.conversations?.length) {
      fetchConversations();
    }
  }, [accessToken]);

  useEffect(() => {
    if (conversations?.pageInfo) {
      const { hasNextPage, endCursor } = conversations.pageInfo;

      if (shouldLoadMore && !isLoadingMore && hasNextPage && endCursor) {
        fetchConversations(endCursor);
      }
    }
  }, [isLoadingMore, shouldLoadMore]);

  return (
    <>
      <Drawer
        className="chat-history-drawer"
        anchor="left"
        open={open}
        variant={isMobile ? 'temporary' : 'persistent'}
        hideBackdrop
        PaperProps={{
          ref: ref,
          onScroll: handleScroll
        }}
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          '& .MuiDrawer-paper': {
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
          <IconButton edge="end" onClick={() => setOpen(false)}>
            <KeyboardDoubleArrowLeftIcon sx={{ color: 'grey.500' }} />
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
      <Box
        sx={{
          position: 'absolute',
          mt: 1,
          ml: 1,
          zIndex: !open ? 1 : -1,
          opacity: !open ? 1 : 0
        }}
      >
        <IconButton
          sx={{
            borderRadius: 1,
            backgroundColor: (theme) => theme.palette.background.paper
          }}
          onClick={() => setOpen(true)}
        >
          <KeyboardDoubleArrowRightIcon />
        </IconButton>
      </Box>
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
