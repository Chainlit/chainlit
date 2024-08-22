import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Page from 'pages/Page';

import {
  IMessageElement,
  useApi,
  useChatData,
  useConfig
} from '@chainlit/react-client';

import { ElementView } from 'components/atoms/elements/ElementView';

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

  const { data, error } = useApi<IMessageElement>(
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

  if (!element || error) {
    return null;
  }

  return (
    <Page>
      <ElementView element={element} onGoBack={() => navigate('/')} />
    </Page>
  );
}
