import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Page from 'pages/Page';

import {
  IMessageElement,
  useApi,
  useChatData,
  useConfig
} from '@chainlit/react-client';

import Alert from '@/components/Alert';
import { ElementView } from '@/components/ElementView';
import { Loader } from '@/components/Loader';

import { useQuery } from 'hooks/query';

export default function Element() {
  const { id } = useParams();
  const query = useQuery();
  const { elements } = useChatData();
  const { config } = useConfig();

  const [element, setElement] = useState<IMessageElement | null>(null);
  const navigate = useNavigate();

  const threadId = query.get('thread');

  const dataPersistence = config?.dataPersistence;

  const { data, isLoading, error } = useApi<IMessageElement>(
    id && threadId && dataPersistence
      ? `/project/thread/${threadId}/element/${id}`
      : null
  );

  useEffect(() => {
    if (data) {
      setElement(data);
    } else if (id && !dataPersistence && !element) {
      const foundElement = elements.find((element) => element.id === id);

      if (foundElement) {
        setElement(foundElement);
      }
    }
  }, [data, element, elements, id, threadId]);

  return (
    <Page>
      <>
        {isLoading ? (
          <div className="flex flex-grow justify-center items-center">
            <Loader className="!size-6" />
          </div>
        ) : null}
        {error ? <Alert variant="error">{error.message}</Alert> : null}
        {element ? (
          <ElementView element={element} onGoBack={() => navigate('/')} />
        ) : null}
      </>
    </Page>
  );
}
