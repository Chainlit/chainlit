import { ApolloClient, InMemoryCache, ApolloProvider } from "@apollo/client";
import { useRecoilValue } from "recoil";
import { accessTokenState, projectSettingsState } from "state/chat";

interface Props {
  children: JSX.Element;
}

export default function CloudProvider({ children }: Props) {
  const accessToken = useRecoilValue(accessTokenState);
  const pSettings = useRecoilValue(projectSettingsState);

  if (!accessToken || !pSettings?.chainlitServer) return null;

  const apolloClient = new ApolloClient({
    uri: `${pSettings.chainlitServer}/api/graphql`,
    cache: new InMemoryCache(),
    headers: {
      Authorization: accessToken,
    },
  });

  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
