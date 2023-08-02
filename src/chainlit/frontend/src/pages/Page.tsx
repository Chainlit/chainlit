import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Alert, Box } from '@mui/material';

import Header from 'components/organisms/header';

import { useAuth } from 'hooks/auth';

import { projectSettingsState } from 'state/project';
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
  const userEnv = useRecoilValue(userEnvState);
  const navigate = useNavigate();

  const isPrivate = pSettings && !pSettings.project?.public;

  useEffect(() => {
    if (pSettings?.project?.user_env) {
      for (const key of pSettings.project?.user_env || []) {
        if (!userEnv[key]) navigate('/env');
      }
    }
    if (isPrivate && !isAuthenticated && !authenticating) {
      navigate('/login');
    }
  }, [pSettings, isAuthenticated, authenticating, userEnv]);

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
