import { ChainlitAPI } from 'api/chainlitApi';
import { capitalize, map, size, uniqBy } from 'lodash';
import { useEffect, useState } from 'react';
import { useInView } from 'react-intersection-observer';
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

import { conversationsHistoryState } from 'state/chatHistory';
import {
  IConversationsFilters,
  conversationsFiltersState
} from 'state/conversations';
import { accessTokenState } from 'state/user';

import { IChat } from 'types/chat';

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

const groupByDate = (data: IChat[]) => {
  const groupedData: { [key: string]: IChat[] } = {};

  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  data.forEach((item) => {
    const createdAt = new Date(item.createdAt);
    const isToday = createdAt.toDateString() === today.toDateString();
    const isYesterday = createdAt.toDateString() === yesterday.toDateString();
    const isLast7Days = createdAt >= sevenDaysAgo;
    const isLast30Days = createdAt >= thirtyDaysAgo;

    let category: string;

    if (isToday) {
      category = 'Today';
    } else if (isYesterday) {
      category = 'Yesterday';
    } else if (isLast7Days) {
      category = 'Previous 7 days';
    } else if (isLast30Days) {
      category = 'Previous 30 days';
    } else {
      const monthYear = createdAt.toLocaleString('default', {
        month: 'long',
        year: 'numeric'
      });

      category = monthYear.split(' ').slice(0, 1).join(' ');
    }

    if (!groupedData[category]) {
      groupedData[category] = [];
    }

    groupedData[category].push(item);
  });

  return groupedData;
};

const ConversationsHistoryList = () => {
  const navigate = useNavigate();
  const { ref, inView } = useInView();

  const [conversations, setConversations] = useRecoilState(
    conversationsHistoryState
  );

  const accessToken = useRecoilValue(accessTokenState);
  const filters = useRecoilValue(conversationsFiltersState);

  const [error, setError] = useState<string | undefined>(undefined);
  const [prevPageInfo, setPrevPageInfo] = useState<IPageInfo | undefined>();
  const [prevFilters, setPrevFilters] =
    useState<IConversationsFilters>(filters);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefetching, setIsRefetching] = useState(false);

  const fetchConversations = async (cursor?: string | number) => {
    try {
      const { pageInfo, data } = await ChainlitAPI.getConversations(
        { first: BATCH_SIZE, cursor },
        filters,
        accessToken
      );
      setPrevPageInfo(pageInfo);
      setError(undefined);

      // Prevent conversations to be duplicated
      const allConversations = uniqBy(
        conversations?.conversations?.concat(data),
        'id'
      );

      if (allConversations) {
        const groupedConversations = groupByDate(allConversations);

        setConversations({
          conversations: allConversations,
          groupedConversations
        });
      }
    } catch (error) {
      if (error instanceof Error) setError(error.message);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  };

  const refetchConversations = async () => {
    setIsLoading(true);
    setPrevPageInfo(undefined);
    fetchConversations(undefined);
  };

  const onDeleteConversation = () => {
    setIsRefetching(true);
    refetchConversations();
  };

  useEffect(() => {
    const filtersHasChanged =
      JSON.stringify(prevFilters) !== JSON.stringify(filters);

    if (size(conversations?.groupedConversations) === 0 || filtersHasChanged) {
      if (filtersHasChanged) {
        setIsRefetching(true);
        setPrevFilters(filters);
      }

      refetchConversations();
    }
  }, [accessToken, filters]);

  useEffect(() => {
    if (inView) loadMoreItems();
  }, [inView]);

  const loadMoreItems = () => {
    if (!isLoading && prevPageInfo?.hasNextPage && prevPageInfo.endCursor) {
      setIsLoading(true);
      fetchConversations(prevPageInfo.endCursor);
    }
  };

  if (isRefetching || (!conversations?.groupedConversations && isLoading)) {
    console.log('ON REFETCH LAAA');
    return [1, 2, 3].map((index) => (
      <Box key={`conversations-skeleton-${index}`} sx={{ px: 1.5, mt: 2 }}>
        <Skeleton variant="rounded" width={100} height={10} />
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
            <Skeleton variant="rounded" width={30} />
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
      <Alert sx={{ mx: 1.5 }} severity="info">
        No result
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
                <ListSubheader>
                  <Typography
                    sx={{
                      py: 1,
                      color: 'grey.500',
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
                      sx={(theme) => ({
                        cursor: 'pointer',
                        p: 1.5,
                        mb: 0.5,
                        gap: 0.5,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        borderRadius: 1,
                        backgroundColor:
                          theme.palette.background[
                            isSelected ? 'default' : 'paper'
                          ],
                        '&:hover': {
                          backgroundColor: theme.palette.background.default
                        }
                      })}
                      onClick={() =>
                        navigate(`/conversation/${conversation.id}`)
                      }
                    >
                      <Stack
                        direction="row"
                        alignItems="center"
                        gap={1.5}
                        maxWidth={isSelected ? '88%' : '100%'}
                      >
                        <ChatBubbleOutline
                          sx={{
                            color: 'grey.700',
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
                      </Stack>
                      {isSelected ? (
                        <DeleteConversationButton
                          conversationId={conversation.id}
                          onDelete={onDeleteConversation}
                        />
                      ) : null}
                    </Stack>
                  );
                })}
              </ul>
            </li>
          );
        })}
        {prevPageInfo?.hasNextPage ? (
          <Stack alignItems={'center'} p={2} ref={ref}>
            <CircularProgress size={30} />
          </Stack>
        ) : null}
      </List>
    </>
  );
};

export { ConversationsHistoryList };
