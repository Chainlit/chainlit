import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box } from '@mui/material';

import SideView from 'components/atoms/element/sideView';
import MessageContainer from 'components/organisms/chat/message/container';
import Playground from 'components/organisms/playground';

import { IAction } from 'state/action';
import { IChat } from 'state/chat';
import { clientState } from 'state/client';

export default function Conversation() {
  const { id } = useParams();
  const client = useRecoilValue(clientState);
  const [error, setError] = useState<string | undefined>();
  const [conversation, setConversation] = useState<IChat | undefined>();

  useEffect(() => {
    if (!id) {
      return;
    }

    setError(undefined);

    client
      .getConversation(id)
      .then((conversation) => setConversation(conversation))
      .catch((err) => {
        setError(err.message);
      });
  }, [client, id]);

  if (!conversation || error) {
    return null;
  }

  const elements = conversation.elements;
  const actions: IAction[] = [];

  return (
    <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
      <Playground />

      <SideView>
        <Box my={1} />
        <MessageContainer
          actions={actions}
          elements={elements}
          messages={conversation.messages}
        />
      </SideView>
    </Box>
  );
}
