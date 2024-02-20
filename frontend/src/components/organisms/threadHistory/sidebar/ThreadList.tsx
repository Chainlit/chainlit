import capitalize from 'lodash/capitalize';
import map from 'lodash/map';
import size from 'lodash/size';
import { Link, useNavigate } from 'react-router-dom';

import ChatBubbleOutline from '@mui/icons-material/ChatBubbleOutline';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListSubheader from '@mui/material/ListSubheader';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import {
  ThreadHistory,
  useChatInteract,
  useChatSession
} from '@chainlit/react-client';
import { grey } from '@chainlit/react-components';

import { Translator } from 'components/i18n';

import { DeleteThreadButton } from './DeleteThreadButton';

interface Props {
  threadHistory?: ThreadHistory;
  error?: string;
  fetchThreads: () => void;
  isFetching: boolean;
  isLoadingMore: boolean;
}

const ThreadList = ({
  threadHistory,
  error,
  fetchThreads,
  isFetching,
  isLoadingMore
}: Props) => {
  const { idToResume } = useChatSession();
  const { clear } = useChatInteract();
  const navigate = useNavigate();
  if (isFetching || (!threadHistory?.timeGroupedThreads && isLoadingMore)) {
    return [1, 2, 3].map((index) => (
      <Box key={`threads-skeleton-${index}`} sx={{ px: 1.5, mt: 2 }}>
        <Skeleton width={100} />
        {[1, 2].map((childIndex) => (
          <Stack
            key={`threads-skeleton-${index}-${childIndex}`}
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

  if (!threadHistory) {
    return null;
  }

  if (size(threadHistory?.timeGroupedThreads) === 0) {
    return (
      <Alert variant="standard" sx={{ mx: 1.5 }} severity="info">
        <Translator path="components.organisms.threadHistory.sidebar.ThreadList.empty" />
      </Alert>
    );
  }

  const handleDeleteThread = (threadId: string) => {
    if (threadId === idToResume) {
      clear();
    }
    if (threadId === threadHistory.currentThreadId) {
      navigate('/');
    }
    fetchThreads();
  };

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
        {map(threadHistory.timeGroupedThreads, (items, index) => {
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
                {map(items, (thread) => {
                  const isResumed =
                    idToResume === thread.id && !threadHistory.currentThreadId;

                  const isSelected =
                    isResumed || threadHistory.currentThreadId === thread.id;

                  return (
                    <Stack
                      component={Link}
                      key={`thread-${thread.id}`}
                      id={`thread-${thread.id}`}
                      sx={(theme) => ({
                        textDecoration: 'none',
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
                      to={isResumed ? '' : `/thread/${thread.id}`}
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
                            overflow: 'hidden',
                            color: (theme) => theme.palette.text.primary
                          }}
                        >
                          <ChatBubbleOutline
                            sx={{
                              width: '16px',
                              height: '16px'
                            }}
                          />
                          <Typography
                            sx={{
                              fontWeight: 500,
                              fontSize: '14px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {capitalize(thread.name || 'Unknown')}
                          </Typography>
                        </Stack>
                        {isSelected ? (
                          <DeleteThreadButton
                            threadId={thread.id}
                            onDelete={() => handleDeleteThread(thread.id)}
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

export { ThreadList };
