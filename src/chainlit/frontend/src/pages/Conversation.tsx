import { Box } from "@mui/material";
import MessageContainer from "components/chat/message/container";
import Page from "pages/Page";
import { useParams } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { IDocuments } from "state/document";
import DocumentSideView from "components/document/sideView";
import Playground from "components/playground";

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
          <Box my={2} />
          <MessageContainer
            documents={documents}
            messages={data.conversation.messages}
          />
        </Box>
        <DocumentSideView />
      </Box>
    </Page>
  );
}
