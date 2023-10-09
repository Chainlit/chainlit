import { useNavigate } from 'react-router-dom';

import { Alert, Box, Button, Skeleton, Stack } from '@mui/material';

import { IAction, nestMessages } from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import MessageContainer from 'components/organisms/chat/message/container';

import { useApi } from 'hooks/useApi';

import { IChat } from 'types/chat';

const Conversation = ({ id }: { id: string }) => {
  const {
    data: conversation,
    error,
    isLoading
  } = useApi<IChat>(id ? `/project/conversation/${id}` : null, {
    revalidateOnFocus: false,
    revalidateIfStale: false
  });

  const navigate = useNavigate();

  if (isLoading) {
    return [1, 2, 3].map((index) => (
      <Stack
        key={`conversation-skeleton-${index}`}
        sx={{
          px: 2,
          gap: 4,
          mt: 5,
          flexDirection: 'row',
          justifyContent: 'center'
        }}
      >
        <Stack>
          <Skeleton width={50} />
          <Skeleton width={50} />
        </Stack>
        <Skeleton
          variant="rounded"
          sx={{
            maxWidth: '60rem',
            width: '100%',
            height: 100
          }}
        />
      </Stack>
    ));
  }

  if (!conversation || error) {
    return null;
  }

  const elements = conversation.elements;
  const actions: IAction[] = [];

  return (
    <Stack direction="row" flexGrow={1} width="100%" height="100%">
      <SideView>
        <Box
          sx={{
            width: '100%',
            maxWidth: '60rem',
            mx: 'auto',
            my: 2
          }}
        >
          <Alert
            sx={{ mx: 2 }}
            severity="info"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => navigate('/')}
              >
                Go back to chat
              </Button>
            }
          >
            This conversation was created on{' '}
            {new Intl.DateTimeFormat().format(conversation.createdAt as number)}
            .
          </Alert>
        </Box>
        <MessageContainer
          loading={false}
          avatars={[]}
          actions={actions}
          elements={elements}
          messages={nestMessages(conversation.messages)}
        />
      </SideView>
    </Stack>
  );
};

export { Conversation };
