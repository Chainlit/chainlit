import { Box } from '@mui/material';
import MessageContainer from 'components/chat/message/container';
import Page from 'pages/Page';
import { useParams } from 'react-router-dom';
import { gql, useQuery } from '@apollo/client';
import { IElements } from 'state/element';
import SideView from 'components/element/sideView';
import Playground from 'components/playground';
import { IAction } from 'state/action';

const ConversationQuery = gql`
  query ($id: ID!) {
    conversation(id: $id) {
      id
      createdAt
      messages {
        id
        isError
        indent
        author
        content
        waitForAnswer
        humanFeedback
        language
        prompt
        llmSettings
        authorIsUser
        createdAt
      }
      elements {
        id
        type
        name
        url
        display
        language
        size
        forId
      }
    }
  }
`;

export default function Conversation() {
  const { id } = useParams();
  const { data, error } = useQuery(ConversationQuery, {
    variables: {
      id: id
    }
  });

  if (!data || error) {
    return null;
  }

  const elements: IElements = data.conversation.elements;
  const actions: IAction[] = [];

  return (
    <Page>
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
            messages={data.conversation.messages}
          />
        </Box>
        <SideView />
      </Box>
    </Page>
  );
}
