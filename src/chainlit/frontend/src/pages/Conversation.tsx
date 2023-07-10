import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box } from '@mui/material';

import MessageContainer from 'components/chat/message/container';
import SideView from 'components/element/sideView';
import Playground from 'components/playground';

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
      .getConversation(parseInt(id, 10))
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
      <Box
        flexGrow={1}
        display="flex"
        flexDirection="column"
        overflow="auto"
        boxSizing="border-box"
        px={{
          xs: 2,
          md: 0
        }}
      >
        <Box my={1} />
        <MessageContainer
          actions={actions}
          elements={elements}
          messages={conversation.messages}
        />
      </Box>
      <SideView />
    </Box>
  );
}
