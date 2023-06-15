import { gql, useQuery } from '@apollo/client';
import { useRecoilValue } from 'recoil';
import { Alert, Box, Stack, Typography } from '@mui/material';
import InfiniteLoader from 'react-window-infinite-loader';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import DeleteConversationButton from './deleteConversationButton';
import OpenConversationButton from './openConversationButton';
import { useCallback, useEffect } from 'react';
import { datasetFiltersState } from 'state/dataset';
import { projectSettingsState } from 'state/project';

const ConversationsQuery = gql`
  query (
    $first: Int
    $projectId: String!
    $cursor: String
    $withFeedback: Int
    $authorEmail: String
    $search: String
  ) {
    conversations(
      first: $first
      cursor: $cursor
      projectId: $projectId
      withFeedback: $withFeedback
      authorEmail: $authorEmail
      search: $search
    ) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        cursor
        node {
          id
          createdAt
          elementCount
          messageCount
          author {
            name
            email
          }
          messages {
            content
          }
        }
      }
    }
  }
`;

const updateQuery = (previousResult: any, { fetchMoreResult }: any) => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  const previousEdges = previousResult.conversations.edges;
  const fetchMoreEdges = fetchMoreResult.conversations.edges;

  fetchMoreResult.conversations.edges = [...previousEdges, ...fetchMoreEdges];

  return { ...fetchMoreResult };
};

const BATCH_SIZE = 50;

const serializeDate = (timestamp: number) => {
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
  const pSettings = useRecoilValue(projectSettingsState);
  const { data, loading, error, refetch, fetchMore } = useQuery(
    ConversationsQuery,
    {
      variables: {
        first: BATCH_SIZE,
        projectId: pSettings?.project?.id,
        withFeedback: df.feedback,
        authorEmail: df.authorEmail,
        search: df.search
      }
    }
  );

  useEffect(() => {
    refetch();
  }, [df]);

  const pageInfo = data?.conversations.pageInfo;

  const loadMoreItems = useCallback(() => {
    if (data && fetchMore && pageInfo.hasNextPage) {
      fetchMore({
        updateQuery,
        variables: {
          first: BATCH_SIZE,
          cursor: pageInfo.endCursor,
          projectId: pSettings?.project?.id,
          withFeedback: df.feedback,
          authorEmail: df.authorEmail,
          search: df.search
        }
      });
    }
  }, [pageInfo, fetchMore, pSettings, df, updateQuery, data]);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (loading) {
    return <Typography color="text.primary">Loading...</Typography>;
  }

  const conversations = data.conversations.edges.map((e: any) => e.node);
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
        style={style}
        sx={{
          display: 'flex',
          alignItems: 'center',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`
        }}
      >
        <RowText text={conversation.id} col={columns['Id']} />
        <RowText text={conversation.author.email} col={columns['Author']} />
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
            onDelete={() => refetch()}
          />
        </Stack>
      </Box>
    );
  };

  const Header = Object.entries(columns).map(([key, value]) => (
    <Typography
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
              isItemLoaded={(index) => conversations[index]}
              itemCount={pageInfo.hasNextPage ? itemCount + 1 : itemCount}
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
