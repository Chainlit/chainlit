import InfiniteLoader from "react-window-infinite-loader";
import { FixedSizeList } from "react-window";
import { gql, useQuery } from "@apollo/client";
import { useRecoilValue } from "recoil";
import { datasetFiltersState, projectSettingsState } from "state/chat";
import {
  Alert,
  Box,
  Stack,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AutoSizer from "react-virtualized-auto-sizer";
import DeleteConversationButton from "./deleteConversationButton";
import OpenConversationButton from "./openConversationButton";
import { useEffect } from "react";

const ConversationsQuery = gql`
  query (
    $first: Int
    $after: ID
    $projectId: String!
    $withFeedback: Int
    $authorEmail: String
    $search: String
  ) {
    conversations(
      first: $first
      after: $after
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
          documentCount
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

const BATCH_SIZE = 50;

export default function ConversationTable() {
  const df = useRecoilValue(datasetFiltersState);
  const pSettings = useRecoilValue(projectSettingsState);
  const { data, loading, error, refetch, fetchMore } = useQuery(
    ConversationsQuery,
    {
      variables: {
        first: BATCH_SIZE,
        projectId: pSettings?.projectId,
        withFeedback: df.feedback,
        authorEmail: df.authorEmail,
        search: df.search,
      },
    }
  );

  useEffect(() => {
    refetch();
  }, [df]);

  if (error) {
    return <Alert severity="error">{error.message}</Alert>;
  }
  if (loading) {
    return <Typography>Loading...</Typography>;
  }
  const pageInfo = data.conversations.pageInfo;
  const conversations = data.conversations.edges.map((e: any) => e.node);
  const itemCount = conversations.length;

  const columns = {
    Author: {
      minWidth: "130px",
      width: "25%",
    },
    "Input": {
      minWidth: "200px",
      width: "40%",
    },
    "Messages": {
      minWidth: "80px",
      width: "12.5%",
    },
    "Documents": {
      minWidth: "80px",
      width: "12.5%",
    },
    Actions: {
      minWidth: "80px",
      width: "10%",
    },
  };

  const RowText = ({ text, width }: any) => {
    return (
      <Tooltip title={text}>
        <Typography
          noWrap
          sx={{
            width: width,
          }}
          color="text.primary"
        >
          {text}
        </Typography>
      </Tooltip>
    );
  };

  const Row = ({ index, style }: any) => {
    const conversation = conversations[index];
    return (
      <Box
        style={style}
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <RowText
          text={conversation.author.email}
          width={columns["Author"].width}
        />
        <RowText
          text={conversation.messages[0].content}
          width={columns["Input"].width}
        />
        <RowText
          text={conversation.messageCount}
          width={columns["Messages"].width}
        />
        <RowText
          text={conversation.documentCount}
          width={columns["Documents"].width}
        />
        <Stack
          direction="row"
          sx={{
            width: columns["Actions"].width,
          }}
        >
          <OpenConversationButton />
          <DeleteConversationButton
            conversationId={conversation.id}
            onDelete={() => refetch()}
          />
        </Stack>
      </Box>
    );
  };

  return (
    <Box sx={{ height: "100%" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        {Object.keys(columns).map((key) => (
          <Typography
            sx={{
              // @ts-ignore
              width: columns[key].width,
            }}
            color="primary.dark"
          >
            {key}
          </Typography>
        ))}
      </Box>
      <AutoSizer>
        {({ height, width }) => (
          <TableBody>
            <InfiniteLoader
              isItemLoaded={(index) => conversations[index]}
              itemCount={itemCount}
              loadMoreItems={(startIndex, stopIndex) => {
                pageInfo.hasNextPage &&
                  fetchMore({
                    variables: {
                      first: BATCH_SIZE,
                      cursor: pageInfo.endCursor,
                      projectId: pSettings?.projectId,
                      withFeedback: df.feedback,
                      authorEmail: df.authorEmail,
                      search: df.search,
                    },
                  });
              }}
            >
              {({ onItemsRendered, ref }) => (
                <FixedSizeList
                  height={height!}
                  width={width!}
                  itemSize={73}
                  itemCount={itemCount}
                  onItemsRendered={onItemsRendered}
                  ref={ref}
                >
                  {Row}
                </FixedSizeList>
              )}
            </InfiniteLoader>
          </TableBody>
        )}
      </AutoSizer>
    </Box>
  );
}
