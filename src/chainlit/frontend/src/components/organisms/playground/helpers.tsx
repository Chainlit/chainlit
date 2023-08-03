import { ILLMProvider, IPlayground } from 'state/playground';

const getProviders = (playground: IPlayground) => {
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
    isChat,
    provider,
    providerFound,
    providers
  };
};

const getDefaultSettings = (providerId: string, providers?: ILLMProvider[]) => {
  if (!providers || providers.length === 0) return {};

  const defaultSettings: { [key: string]: any } = {};
  const provider = providers?.find((provider) => provider.id === providerId);

  provider?.inputs?.forEach(
    (input) => (defaultSettings[input.id] = input.initial)
  );

  return defaultSettings;
};

export { getDefaultSettings, getProviders };
