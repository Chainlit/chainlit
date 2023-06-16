import { Alert, Box } from '@mui/material';
import Header from 'components/header';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'hooks/auth';
import { userEnvState } from 'state/user';

type Props = {
  children: JSX.Element;
};

const Page = ({ children }: Props) => {
  const { isProjectMember, isAuthenticated, isLoading, role, accessToken } =
    useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();
  const userEnv = useRecoilValue(userEnvState);

  const isPrivate = pSettings && !pSettings.project?.public;

  useEffect(() => {
    if (isPrivate && !isAuthenticated && !isLoading) {
      navigate('/login');
    }
  }, [pSettings, isAuthenticated, isLoading]);

  useEffect(() => {
    if (pSettings?.project?.user_env) {
      for (const key of pSettings.project?.user_env || []) {
        if (!userEnv[key]) navigate('/env');
      }
    }
  }, [pSettings, userEnv]);

  if (isPrivate && !accessToken) {
    return null;
  }

  const notAllowed = isPrivate && role && !isProjectMember;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
      }}
    >
      <Header />
      {notAllowed ? (
        <Alert severity="error">You are not part of this project.</Alert>
      ) : (
        children
      )}
    </Box>
  );
};

export default Page;
