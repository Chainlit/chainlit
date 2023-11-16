import { apiClient } from 'api';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { Box } from '@mui/material';

import {
  IConversation,
  conversationsHistoryState,
  useApi
} from '@chainlit/react-client';

import { Conversation } from 'components/organisms/conversationsHistory/Conversation';

import Page from './Page';
import ResumeButton from './ResumeButton';

export default function ConversationPage() {
  const { id } = useParams();
  const { data, error, isLoading } = useApi<IConversation>(
    apiClient,
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
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          gap: 2
        }}
      >
        <Box sx={{ width: '100%', flexGrow: 1, overflow: 'auto' }}>
          <Conversation
            conversation={data}
            error={error}
            isLoading={isLoading}
          />
        </Box>
        <ResumeButton conversationId={id} />
      </Box>
    </Page>
  );
}
