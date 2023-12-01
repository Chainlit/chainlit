import { Link } from 'react-router-dom';

import { Alert, Box, Button, Skeleton, Stack } from '@mui/material';

import {
  IAction,
  IMessageElement,
  IThread,
  nestMessages
} from '@chainlit/react-client';

import SideView from 'components/atoms/element/sideView';
import MessageContainer from 'components/organisms/chat/Messages/container';

type Props = {
  thread?: IThread;
  error?: Error;
  isLoading?: boolean;
};

const Thread = ({ thread, error, isLoading }: Props) => {
  if (isLoading) {
    return [1, 2, 3].map((index) => (
      <Stack
        key={`thread-skeleton-${index}`}
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

  if (!thread || error) {
    return null;
  }

  const elements = thread.elements;
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
            id="thread-info"
            severity="info"
            action={
              <Button component={Link} color="inherit" size="small" to="/">
                Go back to chat
              </Button>
            }
          >
            This chat was created on{' '}
            {new Intl.DateTimeFormat().format(new Date(thread.createdAt))}.
          </Alert>
        </Box>
        <MessageContainer
          loading={false}
          avatars={[]}
          actions={actions}
          elements={(elements || []) as IMessageElement[]}
          messages={nestMessages(thread.steps)}
        />
      </SideView>
    </Stack>
  );
};

export { Thread };
