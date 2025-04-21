import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Runner } from 'react-runner';
import { useRecoilValue } from 'recoil';
import { v4 as uuidv4 } from 'uuid';

import {
  ChainlitContext,
  IAction,
  ICustomElement,
  IElement,
  sessionIdState,
  useAuth,
  useChatInteract
} from '@chainlit/react-client';

import Alert from '@/components/Alert';

import Imports from './Imports';
import * as Renderer from './Renderer';

const CustomElement = memo(function ({ element }: { element: ICustomElement }) {
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);
  const { sendMessage } = useChatInteract();
  const { user } = useAuth();

  const [sourceCode, setSourceCode] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    apiClient
      .get(`/public/elements/${element.name}.jsx`)
      .then(async (res) => setSourceCode(await res.text()))
      .catch((err) => setError(String(err)));
  }, [element.name, apiClient]);

  const updateElement = useCallback(
    (nextProps: Record<string, unknown>) => {
      if (!sessionId) return;
      const nextElement: IElement = { ...element, props: nextProps };
      return apiClient.updateElement(nextElement, sessionId);
    },
    [element, sessionId, apiClient]
  );

  const deleteElement = useCallback(() => {
    if (!sessionId) return;
    return apiClient.deleteElement(element, sessionId);
  }, [element, sessionId, apiClient]);

  const callAction = useCallback(
    (action: IAction) => {
      if (!sessionId) return;
      return apiClient.callAction(action, sessionId);
    },
    [sessionId, apiClient]
  );

  const sendUserMessage = useCallback(
    (message: string) => {
      return sendMessage({
        threadId: '',
        id: uuidv4(),
        name: user?.identifier || 'User',
        type: 'user_message',
        output: message,
        createdAt: new Date().toISOString(),
        metadata: { location: window.location.href }
      });
    },
    [sendMessage, user]
  );

  const props = useMemo(() => {
    return JSON.parse(JSON.stringify(element.props));
  }, [element.props]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!sourceCode) return null;

  return (
    <div className={`${element.display}-custom flex flex-col flex-grow`}>
      <Runner
        code={sourceCode}
        scope={{
          import: { ...Imports, '@/components/renderer': Renderer },
          props,
          apiClient,
          updateElement,
          deleteElement,
          callAction,
          sendUserMessage
        }}
        onRendered={(error) => setError(error?.message)}
      />
    </div>
  );
});

export default CustomElement;
