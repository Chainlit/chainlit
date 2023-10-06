import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Alert, Box, Stack } from '@mui/material';

import { ConversationsHistorySidebar } from 'components/organisms/conversationsHistory/sidebar';
import Header from 'components/organisms/header';

import { useAuth } from 'hooks/auth';

import { projectSettingsState } from 'state/project';
import { userEnvState } from 'state/user';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const userEnv = useRecoilValue(userEnvState);
  const navigate = useNavigate();

  useEffect(() => {
    if (pSettings?.userEnv) {
      for (const key of pSettings.userEnv || []) {
        if (!userEnv[key]) navigate('/env');
      }
    }
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [pSettings, isAuthenticated, userEnv]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Header />
      {!isAuthenticated ? (
        <Alert severity="error">You are not part of this project.</Alert>
      ) : (
        <Stack direction="row" height="100%" overflow="auto">
          <ConversationsHistorySidebar />
          {children}
        </Stack>
      )}
    </Box>
  );
};

export default Page;
