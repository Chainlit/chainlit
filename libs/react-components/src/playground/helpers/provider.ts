import { ILLMProvider, IPlayground } from 'src/types/playground';

const getProviders = (playground: IPlayground) => {
  const providers = playground?.providers || [];

  if (!providers?.length) {
    throw new Error('No LLM provider available');
  }

  let provider = providers.find(
    (provider) => provider.id === playground.generation?.provider
  );

  const providerFound = !!provider;

  provider = provider || providers[0];

  return {
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
