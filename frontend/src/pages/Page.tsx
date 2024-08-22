import { Navigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Alert, Box, Stack } from '@mui/material';

import { sideViewState, useAuth, useConfig } from '@chainlit/react-client';

import { ElementSideView } from 'components/atoms/elements';
import { Translator } from 'components/i18n';
import { TaskList } from 'components/molecules/tasklist/TaskList';
import { Header } from 'components/organisms/header';
import { SideBar } from 'components/organisms/sidebar';

import { userEnvState } from 'state/user';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isAuthenticated } = useAuth();
  const { config } = useConfig();
  const userEnv = useRecoilValue(userEnvState);
  const sideViewElement = useRecoilValue(sideViewState);

  if (config?.userEnv) {
    for (const key of config.userEnv || []) {
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
