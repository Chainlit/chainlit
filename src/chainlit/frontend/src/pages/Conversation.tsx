import { Box } from "@mui/material";
import Messages from "components/chat/messages";
import ChatTopBar from "components/chat/topBar";
import Page from "pages/Page";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { IDocuments } from "state/chat";
import DocumentSideView from "components/document/sideView";
import Playground from "components/playground";

const ConversationQuery = gql`
  query ($id: ID!) {
    conversation(id: $id) {
      id
      createdAt
      messages {
        id
        final
        isError
        indent
        author
        content
        waitForUser
        humanFeedback
        language
        prompt
        llmSettings
        authorIsUser
      }
      documents {
        type
        name
        url
        display
      }
    }
  }
`;

export default function Conversation() {
  const { id } = useParams();
  const { data, error } = useQuery(ConversationQuery, {
    variables: {
      id: id,
    },
  });

  if (!data || error) {
    return null;
  }

  const documents: IDocuments = {};
  data.conversation.documents.forEach((d: any) => (documents[d.name] = d));

  return (
    <Page>
      <Box display="flex" flexGrow={1} width="100%" overflow="scroll">
        <Playground />
        <Box
          flexGrow={1}
          display="flex"
          flexDirection="column"
          overflow="scroll"
        >
          <ChatTopBar />
          <Messages
            documents={documents}
            messages={data.conversation.messages}
          />
        </Box>
        <DocumentSideView />
      </Box>
    </Page>
  );
}
