import { useRecoilValue } from 'recoil';
import CloudProvider from 'components/cloudProvider';
import { gql, useLazyQuery } from '@apollo/client';
import { projectSettingsState } from 'state/project';
import HistoryButton from './button';
import { useAuth } from 'hooks/auth';

const ConversationsQuery = gql`
  query ($first: Int, $projectId: String!, $authorEmail: String) {
    conversations(
      first: $first
      projectId: $projectId
      authorEmail: $authorEmail
    ) {
      edges {
        cursor
        node {
          id
          createdAt
          messages {
            content
          }
        }
      }
    }
  }
`;

interface Props {
  onClick: (content: string) => void;
}

function _CloudHistoryButton({ onClick }: Props) {
  const { user } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const [_, { data, refetch }] = useLazyQuery(ConversationsQuery, {
    variables: {
      first: 30,
      projectId: pSettings?.project?.id,
      authorEmail: user?.email
    }
  });

  const chats = data?.conversations.edges
    .map((e: any) => e.node)
    .filter((c: any) => c.messages.length > 0);

  return <HistoryButton onClick={onClick} onOpen={refetch} chats={chats} />;
}

export default function CloudHistoryButton({ onClick }: Props) {
  return (
    <CloudProvider>
      <_CloudHistoryButton onClick={onClick} />
    </CloudProvider>
  );
}
