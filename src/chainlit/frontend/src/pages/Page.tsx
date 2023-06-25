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
  const {
    isProjectMember,
    authenticating,
    isAuthenticated,
    accessToken,
    role
  } = useAuth();
  const pSettings = useRecoilValue(projectSettingsState);
  const navigate = useNavigate();
  const userEnv = useRecoilValue(userEnvState);

  const isPrivate = pSettings && !pSettings.project?.public;

  useEffect(() => {
    if (isPrivate && !isAuthenticated && !authenticating) {
      navigate('/login');
    }
  }, [pSettings, isAuthenticated, authenticating]);

  useEffect(() => {
    if (pSettings?.project?.user_env) {
      for (const key of pSettings.project?.user_env || []) {
        if (!userEnv[key]) navigate('/env');
      }
    }
  }, [pSettings, userEnv]);

  if (!pSettings || (isPrivate && (!accessToken || !role))) {
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
