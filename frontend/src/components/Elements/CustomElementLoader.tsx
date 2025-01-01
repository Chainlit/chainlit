import React, {
  Suspense,
  lazy,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  ChainlitContext,
  IAction,
  ICustomElement,
  IElement,
  useChatSession
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { Button } from '@/components/ui/button';

const JsxParser = lazy(() => import('react-jsx-parser'));

export default function CustomElement({
  element
}: {
  element: ICustomElement;
}) {
  const apiClient = useContext(ChainlitContext);
  const { sessionId } = useChatSession();

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
    <Suspense fallback={null}>
      <JsxParser
        className={`${element.display}-custom`}
        blacklistedAttrs={[]}
        bindings={{
          props,
          Object,
          updateElement,
          deleteElement,
          callAction,
          React
        }}
        components={{ Button }}
        jsx={sourceCode}
        renderError={({ error }) => (
          <Alert variant="error">{`Failed to render ${element.name}: ${error}`}</Alert>
        )}
      />
    </Suspense>
  );
}
