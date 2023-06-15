import { Auth0Provider } from '@auth0/auth0-react';
import { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';

interface Props {
  children: JSX.Element;
}

export default memo(function AuthProvider({ children }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);

  if (pSettings?.project?.id) {
    return (
      <Auth0Provider
        domain="https://auth.chainlit.io"
        clientId="ADo93BBXDn8Z35lEi8arCWiR7C0ncrjx"
        authorizationParams={{
          redirect_uri: `${window.location.origin}/api/auth/callback`
        }}
        useRefreshTokens={true}
        cacheLocation="localstorage"
      >
        {children}
      </Auth0Provider>
    );
  } else {
    return <>{children}</>;
  }
});
