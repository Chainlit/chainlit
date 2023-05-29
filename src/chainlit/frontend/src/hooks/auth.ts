import { useAuth0 } from '@auth0/auth0-react';
import { useRecoilValue } from 'recoil';
import { accessTokenState, roleState } from 'state/user';

export const useAuth = () => {
  const { isAuthenticated, ...other } = useAuth0();
  const accessToken = useRecoilValue(accessTokenState);
  const role = useRecoilValue(roleState);
  const isProjectMember = isAuthenticated && role && role !== 'ANONYMOUS';

  return {
    role,
    accessToken,
    isAuthenticated,
    isProjectMember,
    ...other
  };
};
