import { useConfig } from '@chainlit/react-client';

const useLayoutMaxWidth = () => {
  const { config } = useConfig();
  return config?.ui.layout === 'wide'
    ? 'min(60rem, 100vw)'
    : 'min(55rem, 100vw)';
};

export { useLayoutMaxWidth };
