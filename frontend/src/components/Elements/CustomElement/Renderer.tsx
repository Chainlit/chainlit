import { memo, useState } from 'react';
import { Runner } from 'react-runner';

import Alert from '@/components/Alert';

import Imports from './Imports';

const createMockAPIs = () => {
  return {
    updateElement: async (
      nextProps: Record<string, any>
    ): Promise<{ success: boolean }> => {
      console.log('updateElement called with:', nextProps);
      return { success: true };
    },

    deleteElement: async (): Promise<{ success: boolean }> => {
      console.log('deleteElement called');
      return { success: true };
    },

    callAction: async (action: {
      name: string;
      payload: Record<string, unknown>;
    }): Promise<{ success: boolean }> => {
      console.log('callAction called with:', action);
      return { success: true };
    },

    sendUserMessage: (message: string): void => {
      console.log('sendUserMessage called with:', message);
    }
  };
};

const Renderer = memo(function ({
  sourceCode,
  props
}: {
  sourceCode: string;
  props: Record<string, unknown>;
}) {
  const [error, setError] = useState<string>();

  if (error) return <Alert variant="error">{error}</Alert>;

  if (!sourceCode) return null;

  const mockedApis = createMockAPIs();

  return (
    <Runner
      code={sourceCode}
      scope={{
        import: Imports,
        props,
        ...mockedApis
      }}
      onRendered={(error) => setError(error?.message)}
    />
  );
});

export { Renderer };
