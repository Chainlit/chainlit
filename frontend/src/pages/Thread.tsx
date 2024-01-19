import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilState, useRecoilValue } from 'recoil';

import { Box } from '@mui/material';

import { IThread, threadHistoryState, useApi } from '@chainlit/react-client';

import { Thread } from 'components/organisms/threadHistory/Thread';

import { apiClientState } from 'state/apiClient';

import Page from './Page';
import ResumeButton from './ResumeButton';

export default function ThreadPage() {
  const { id } = useParams();
  const apiClient = useRecoilValue(apiClientState);

  const { data, error, isLoading } = useApi<IThread>(
    apiClient,
    id ? `/project/thread/${id}` : null,
    {
      revalidateOnFocus: false,
      revalidateIfStale: false
    }
  );

  const [threadHistory, setThreadHistory] = useRecoilState(threadHistoryState);

  useEffect(() => {
    if (threadHistory?.currentThreadId !== id) {
      setThreadHistory((prev) => {
        return { ...prev, currentThreadId: id };
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
          <Thread thread={data} error={error} isLoading={isLoading} />
        </Box>
        <ResumeButton threadId={id} />
      </Box>
    </Page>
  );
}
