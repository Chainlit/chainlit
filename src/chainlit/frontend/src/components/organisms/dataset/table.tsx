import { useCallback, useEffect, useState } from 'react';
import AutoSizer from 'react-virtualized-auto-sizer';
import { FixedSizeList } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useRecoilValue } from 'recoil';

import { Alert, Box, Stack, Typography } from '@mui/material';

import { IChat } from 'state/chat';
import { clientState } from 'state/client';
import { datasetFiltersState } from 'state/dataset';

import DeleteConversationButton from './deleteConversationButton';
import OpenConversationButton from './openConversationButton';

export interface IPageInfo {
  hasNextPage: boolean;
  endCursor: any;
}

export interface IPagination {
  first: number;
  cursor?: string | number;
}

const BATCH_SIZE = 30;

const serializeDate = (timestamp: number | string) => {
  const dateOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  };
  return new Date(timestamp).toLocaleDateString(undefined, dateOptions);
};

export default function ConversationTable() {
  const df = useRecoilValue(datasetFiltersState);
  const [conversations, setConversations] = useState<IChat[]>([]);
  const [prevPageInfo, setPrevPageInfo] = useState<IPageInfo | undefined>();
  const client = useRecoilValue(clientState);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(
    async (cursor?: string | number) => {
      try {
        const { pageInfo, data } = await client.getConversations(
          { first: BATCH_SIZE, cursor },
          df
        );
        setPrevPageInfo(pageInfo);
        setError(undefined);
        setConversations((prev) => [...prev, ...data]);
      } catch (error) {
        if (error instanceof Error) setError(error.message);
      } finally {
        setLoading(false);
      }
    },
    [client, df]
  );

  const refetchConversations = useCallback(async () => {
    setConversations([]);
    setLoading(true);
    setPrevPageInfo(undefined);
    fetchConversations(undefined);
  }, [fetchConversations]);

  useEffect(() => {
    refetchConversations();
  }, [refetchConversations]);

  const loadMoreItems = useCallback(() => {
    if (prevPageInfo?.hasNextPage) {
      fetchConversations(prevPageInfo.endCursor);
    }
  }, [prevPageInfo, fetchConversations]);

  if (error) {
    return <Alert severity="error">{(error as any).message}</Alert>;
  }
  if (loading) {
    return <Typography color="text.primary">Loading...</Typography>;
  }

  const itemCount = conversations.length;

  if (itemCount === 0) {
    return <Alert severity="info">No result</Alert>;
  }

  const columns = {
    Id: {
      minWidth: '60px',
      width: '5%'
    },
    Author: {
      minWidth: '130px',
      width: '25%'
    },
    Input: {
      minWidth: '200px',
      width: '35%'
    },
    Date: {
      minWidth: '120px',
      width: '25%'
    },
    Actions: {
      minWidth: '80px',
      width: '10%'
    }
  };

  const RowText = ({ text, col }: any) => {
    return (
      <Typography
        noWrap
        sx={{
          width: col.width,
          minWidth: col.minWidth,
          fontSize: '0.875rem'
        }}
        color="text.primary"
      >
        {text}
      </Typography>
    );
  };

  const Row = ({ index, style }: any) => {
    const conversation = conversations[index];
    return (
      <Box
        className="conversation-row"
        style={style}
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <RowText text={conversation.id} col={columns['Id']} />
        <RowText
          text={conversation.author?.email || 'LocalUser'}
          col={columns['Author']}
        />
        <RowText
          text={conversation.messages[0]?.content}
          col={columns['Input']}
        />
        <RowText
          text={serializeDate(conversation.createdAt)}
          col={columns['Date']}
        />
        <Stack
          direction="row"
          sx={{
            width: columns['Actions'].width,
            minWidth: columns['Actions'].minWidth
          }}
        >
          <OpenConversationButton conversationId={conversation.id} />
          <DeleteConversationButton
            conversationId={conversation.id}
            onDelete={() => refetchConversations()}
          />
        </Stack>
      </Box>
    );
  };

  const Header = Object.entries(columns).map(([key, value]) => (
    <Typography
      key={key}
      sx={{
        fontSize: '0.875rem',
        width: value.width,
        minWidth: value.minWidth
      }}
      color="primary"
    >
      {key}
    </Typography>
  ));

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          height: '40px',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        {Header}
      </Box>
      <Box flexGrow={1}>
        <AutoSizer>
          {({ height, width }) => (
            <InfiniteLoader
              isItemLoaded={(index) => !!conversations[index]}
              itemCount={prevPageInfo?.hasNextPage ? itemCount + 1 : itemCount}
              loadMoreItems={loadMoreItems}
            >
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  height={height!}
                  width={width!}
                  itemSize={55}
                  itemCount={itemCount}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {Row}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          )}
        </AutoSizer>
      </Box>
    </Box>
  );
}
