import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { useAuth } from 'hooks/auth';
import { memo } from 'react';
import { useRecoilValue } from 'recoil';
import { projectSettingsState } from 'state/project';

interface Props {
  children: JSX.Element;
}

export default memo(function CloudProvider({ children }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);
  const { isProjectMember, accessToken } = useAuth();

  if (!!pSettings?.project.public || isProjectMember === false) return null;

  if (!accessToken) {
    return null;
  }

  const apolloClient = new ApolloClient({
    uri: `${pSettings?.chainlitServer}/api/graphql`,
    cache: new InMemoryCache(),
    headers: {
      Authorization: accessToken
    }
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
});
