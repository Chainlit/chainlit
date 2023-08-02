import { Playground } from 'state/playground';

export default function getProvider(playground: Playground) {
  const isChat = !!playground?.prompt?.messages;

  const providers = playground?.providers
    ? playground.providers.filter((p) => p.is_chat === isChat)
    : [];

  if (!providers?.length) {
    throw new Error('No LLM provider available');
  }

  let provider = providers.find(
    (provider) => provider.id === playground.prompt?.provider
  );

  const providerFound = !!provider;

  provider = provider || providers[0];

  return {
    provider,
    providerFound
  };
}
