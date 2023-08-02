import { useAuth0 } from '@auth0/auth0-react';
import { useRecoilValue } from 'recoil';

import { projectSettingsState } from 'state/project';
import { accessTokenState, roleState } from 'state/user';

export const useAuth = () => {
  const pSettings = useRecoilValue(projectSettingsState);
  const { isAuthenticated, isLoading: _isLoading, ...other } = useAuth0();
  const accessToken = useRecoilValue(accessTokenState);
  const role = useRecoilValue(roleState);

  // If project id isn't set, the auth0 provider is not used and _isLoading is always true
  const isLoading = _isLoading && pSettings?.project?.id;

  const isProjectMember = isAuthenticated && role && role !== 'ANONYMOUS';

  const cloudAuthRequired =
    pSettings?.project.id && pSettings?.project.public === false;
  const authenticating = isLoading || (isAuthenticated && !accessToken);

  return {
    role,
    accessToken,
    isAuthenticated,
    authenticating,
    isProjectMember,
    isLoading,
    cloudAuthRequired,
    ...other
  };
};
