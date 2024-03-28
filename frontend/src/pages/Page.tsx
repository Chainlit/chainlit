import { useAuth } from 'api/auth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Alert, Box, Stack } from '@mui/material';

import { Translator } from 'components/i18n';
import { Header } from 'components/organisms/header';
import { ThreadHistorySideBar } from 'components/organisms/threadHistory/sidebar';

import { projectSettingsState } from 'state/project';
import { userEnvState } from 'state/user';

import { useSessionStorage } from 'react-use-sessionstorage';
import { useEffect } from 'react';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const projectSettings = useRecoilValue(projectSettingsState);
  const userEnv = useRecoilValue(userEnvState);

  const formDataObj = (window as any).formData ?? {};
  const formDataJSON = JSON.stringify(formDataObj);

  const [, setFormData] = useSessionStorage('formData', formDataJSON);

  useEffect(() => {
    if (formDataObj && Object.keys(formDataObj).length) {
      setFormData(formDataJSON);
    }
  }, []);

  if (projectSettings?.userEnv) {
    for (const key of projectSettings.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  if (!isAuthenticated) {
    navigate('/login');
    // return <Navigate to="/login" />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Header projectSettings={projectSettings} />
      {!isAuthenticated ? (
        <Alert severity="error">
          <Translator path="pages.Page.notPartOfProject" />
        </Alert>
      ) : (
        <Stack direction="row" height="100%" width="100%" overflow="auto">
          <ThreadHistorySideBar />
          {children}
        </Stack>
      )}
    </Box>
  );
};

export default Page;
