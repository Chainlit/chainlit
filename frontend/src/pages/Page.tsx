import { useAuth } from 'api/auth';
import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Alert, Box, Stack } from '@mui/material';

import { ElementSideView } from 'components/atoms/elements';
import { Translator } from 'components/i18n';
import { TaskList } from 'components/molecules/tasklist/TaskList';
import { Header } from 'components/organisms/header';
import { SideBar } from 'components/organisms/sidebar';

import { projectSettingsState } from 'state/project';
import { userEnvState } from 'state/user';

import { sideViewState } from 'client-types/*';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  const projectSettings = useRecoilValue(projectSettingsState);
  const userEnv = useRecoilValue(userEnvState);
  const sideViewElement = useRecoilValue(sideViewState);

  if (projectSettings?.userEnv) {
    for (const key of projectSettings.userEnv || []) {
      if (!userEnv[key]) return <Navigate to="/env" />;
    }
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      {!isAuthenticated ? (
        <Alert severity="error">
          <Translator path="pages.Page.notPartOfProject" />
        </Alert>
      ) : (
        <Stack direction="row" height="100%" width="100%">
          <SideBar />
          <Stack flexGrow={1}>
            <Header />
            <Stack direction="row" flexGrow={1} overflow="auto">
              {children}
            </Stack>
          </Stack>
          {sideViewElement ? null : <TaskList isMobile={false} />}
          <ElementSideView />
        </Stack>
      )}
    </Box>
  );
};

export default Page;
