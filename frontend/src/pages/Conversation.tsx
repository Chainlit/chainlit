import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { Box } from '@mui/material';

import { Conversation } from 'components/organisms/conversationsHistory/Conversation';

import { useApi } from 'hooks/useApi';

import { conversationsHistoryState } from 'state/conversations';

import { IChat } from 'types/chat';

import Page from './Page';

export default function ConversationPage() {
  const { id } = useParams();
  const { data, error, isLoading } = useApi<IChat>(
    id ? `/project/conversation/${id}` : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  );

  const [conversations, setConversations] = useRecoilState(
    conversationsHistoryState
  );

  useEffect(() => {
    if (conversations?.currentConversationId !== id) {
      setConversations((prev) => {
        return { ...prev, currentConversationId: id };
      });
    }
  }, [id]);

  return (
    <Page>
      <Box
        sx={{
          overflow: 'auto',
          display: 'flex',
          flexGrow: 1,
          gap: 2
        }}
      >
        <Box sx={{ width: '100%' }}>
          <Conversation
            conversation={data}
            error={error}
            isLoading={isLoading}
          />
        </Box>
      </Box>
    </Page>
  );
}
