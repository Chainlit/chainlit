import { ChainlitAPI } from 'api/chainlitApi';
import { capitalize, map, size, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';

import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { grey } from '@chainlit/components';

import {
  IConversationsFilters,
  conversationsFiltersState,
  conversationsHistoryState
} from 'state/conversations';
import { accessTokenState } from 'state/user';

import { DeleteConversationButton } from './DeleteConversationButton';

export interface IPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface IPagination {
  first: number;
  cursor?: string | number;
}

const BATCH_SIZE = 30;

const ConversationsHistoryList = ({
  shouldLoadMore,
  setShouldLoadMore
}: {
  shouldLoadMore: boolean;
  setShouldLoadMore: (value: boolean) => void;
}) => {
  const navigate = useNavigate();

  const [conversations, setConversations] = useRecoilState(
    conversationsHistoryState
  );
  const accessToken = useRecoilValue(accessTokenState);
  const filters = useRecoilValue(conversationsFiltersState);

  const [error, setError] = useState<string | undefined>(undefined);
  const [prevPageInfo, setPrevPageInfo] = useState<IPageInfo | undefined>();
  const [prevFilters, setPrevFilters] =
    useState<IConversationsFilters>(filters);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

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
      setPrevPageInfo(pageInfo);
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
    if (!isLoadingMore && prevPageInfo?.hasNextPage && prevPageInfo.endCursor) {
      fetchConversations(prevPageInfo.endCursor);
    }
  }, [isLoadingMore, shouldLoadMore]);

  if (isFetching || (!conversations?.groupedConversations && isLoadingMore)) {
    return [1, 2, 3].map((index) => (
      <Box key={`conversations-skeleton-${index}`} sx={{ px: 1.5, mt: 2 }}>
        <Skeleton width={100} />
        {[1, 2].map((childIndex) => (
          <Stack
            key={`conversations-skeleton-${index}-${childIndex}`}
            sx={{
              py: 2,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <Skeleton width={30} />
            <Skeleton width={'100%'} />
          </Stack>
        ))}
      </Box>
    ));
  }

  if (error) {
    return (
      <Alert sx={{ mx: 1.5 }} severity="error">
        {(error as any).message}
      </Alert>
    );
  }

  if (!conversations) {
    return null;
  }

  if (size(conversations?.groupedConversations) === 0) {
    return (
      <Alert variant="outlined" sx={{ mx: 1.5 }} severity="info">
        Empty...
      </Alert>
    );
  }

  return (
    <>
      <List
        sx={{
          px: 1,
          height: 0,
          bgcolor: 'background.paper',
          '& ul': { padding: 0 }
        }}
        subheader={<li />}
      >
        {map(conversations.groupedConversations, (items, index) => {
          return (
            <li key={`section-${index}`}>
              <ul>
                <ListSubheader sx={{ px: 1.5 }}>
                  <Typography
                    sx={{
                      py: 1,
                      color: 'text.secondary',
                      fontWeight: 600,
                      fontSize: '12px',
                      backgroundColor: (theme) => theme.palette.background.paper
                    }}
                  >
                    {index}
                  </Typography>
                </ListSubheader>
                {map(items, (conversation) => {
                  const isSelected =
                    conversations.currentConversationId === conversation.id;

                  return (
                    <Stack
                      key={`conversation-${conversation.id}`}
                      id={`conversation-${conversation.id}`}
                      sx={(theme) => ({
                        cursor: 'pointer',
                        p: 1.5,
                        mb: 0.5,
                        gap: 0.5,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        borderRadius: 1,
                        backgroundColor: isSelected
                          ? theme.palette.mode === 'dark'
                            ? grey[800]
                            : 'grey.200'
                          : theme.palette.background.paper,
                        '&:hover': {
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? grey[800]
                              : 'grey.200'
                        }
                      })}
                      onClick={() =>
                        navigate(`/conversation/${conversation.id}`)
                      }
                    >
                      <Stack
                        direction="row"
                        width="100%"
                        alignItems="center"
                        gap={1.5}
                      >
                        <ChatBubbleOutline
                          sx={{
                            color: 'inherit',
                            width: '16px',
                            height: '16px'
                          }}
                        />
                        <Typography
                          sx={{
                            fontWeight: 500,
                            fontSize: '14px',
                            color: (theme) => theme.palette.text.primary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {capitalize(conversation.messages[0]?.content)}
                        </Typography>
                        {isSelected ? (
                          <DeleteConversationButton
                            conversationId={conversation.id}
                            onDelete={fetchConversations}
                          />
                        ) : null}
                      </Stack>
                    </Stack>
                  );
                })}
              </ul>
            </li>
          );
        })}
        {isLoadingMore ? (
          <Stack alignItems={'center'} p={2}>
            <CircularProgress size={30} />
          </Stack>
        ) : null}
      </List>
    </>
  );
};

export { ConversationsHistoryList };
