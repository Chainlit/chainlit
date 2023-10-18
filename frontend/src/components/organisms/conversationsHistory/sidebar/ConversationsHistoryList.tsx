import { capitalize, map, size } from 'lodash';
import { useNavigate } from 'react-router-dom';

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

import { ConversationsHistory } from 'types/chatHistory';

import { DeleteConversationButton } from './DeleteConversationButton';

export interface IPageInfo {
  hasNextPage: boolean;
  endCursor?: string;
}

export interface IPagination {
  first: number;
  cursor?: string | number;
}

interface ConversationsHistoryProps {
  conversations: ConversationsHistory;
  error?: string;
  fetchConversations: () => void;
  isFetching: boolean;
  isLoadingMore: boolean;
}

const ConversationsHistoryList = ({
  conversations,
  error,
  fetchConversations,
  isFetching,
  isLoadingMore
}: ConversationsHistoryProps) => {
  const navigate = useNavigate();

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
      <Alert variant="standard" sx={{ mx: 1.5 }} severity="info">
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
                        justifyContent="space-between"
                      >
                        <Stack
                          sx={{
                            alignItems: 'center',
                            flexDirection: 'row',
                            gap: 1.5,
                            overflow: 'hidden'
                          }}
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
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {capitalize(conversation.messages[0]?.content)}
                          </Typography>
                        </Stack>
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
        <Stack alignItems={'center'}>
          <CircularProgress
            id={'chat-history-loader'}
            size={30}
            sx={{ my: 1, opacity: isLoadingMore ? 1 : 0 }}
          />
        </Stack>
      </List>
    </>
  );
};

export { ConversationsHistoryList };
