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

import {
  ChainlitContext,
  IAction,
  ICustomElement,
  IElement,
  sessionIdState
} from '@chainlit/react-client';

import Alert from '@/components/Alert';

import Imports from './Imports';

const CustomElement = memo(function ({ element }: { element: ICustomElement }) {
  const apiClient = useContext(ChainlitContext);
  const sessionId = useRecoilValue(sessionIdState);

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

  const props = useMemo(() => {
    return JSON.parse(JSON.stringify(element.props));
  }, [element.props]);

  if (error) return <Alert variant="error">{error}</Alert>;
  if (!sourceCode) return null;

  return (
    <div className={`${element.display}-custom`}>
      <Runner
        code={sourceCode}
        scope={{
          import: Imports,
          props,
          apiClient,
          updateElement,
          deleteElement,
          callAction
        }}
        onRendered={(error) => setError(error?.message)}
      />
    </div>
  );
});

export default CustomElement;
