import { Box, Skeleton, Stack } from '@mui/material';

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
    <Stack direction="row" flexGrow={1} width="100%" height={'100%'}>
      <SideView>
        <Box my={1} />
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
