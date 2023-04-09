import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { useAuth } from "hooks/auth";
import { useRecoilValue } from "recoil";
import { projectSettingsState } from "state/project";

interface Props {
  children: JSX.Element;
}

export default function CloudProvider({ children }: Props) {
  const pSettings = useRecoilValue(projectSettingsState);
  const { isProjectMember, accessToken } = useAuth();

  if (!pSettings?.chainlitServer || !isProjectMember) return null;

  const apolloClient = new ApolloClient({
    uri: `${pSettings.chainlitServer}/api/graphql`,
    cache: new InMemoryCache(),
    headers: {
      Authorization: accessToken!,
    },
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
