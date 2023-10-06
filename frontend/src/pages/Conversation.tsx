import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState } from 'recoil';

import { Box } from '@mui/material';

import { Conversation } from 'components/organisms/conversationsHistory/Conversation';

import { conversationsHistoryState } from 'state/conversations';

import Page from './Page';

export default function ConversationPage() {
  const { id } = useParams();
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
        {id ? (
          <Box sx={{ width: '100%' }}>
            <Conversation id={id} />
          </Box>
        ) : null}
      </Box>
    </Page>
  );
}
