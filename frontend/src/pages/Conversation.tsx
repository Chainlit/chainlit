import { useParams } from 'react-router-dom';

import { Box } from '@mui/material';

import { IAction, nestMessages } from '@chainlit/components';

import SideView from 'components/atoms/element/sideView';
import MessageContainer from 'components/organisms/chat/message/container';

import { useApi } from 'hooks/useApi';

import { IChat } from 'types/chat';

export default function Conversation() {
  const { id } = useParams();

  const { data: conversation, error } = useApi<IChat>(
    id ? `/project/conversation/${id}` : null
  );

  if (!conversation || error) {
    return null;
  }

  const elements = conversation.elements;
  const actions: IAction[] = [];

  return (
    <Box display="flex" flexGrow={1} width="100%">
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
    </Box>
  );
}
