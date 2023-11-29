import { apiClient } from 'api';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Page from 'pages/Page';

import { IMessageElement, useApi, useChatData } from '@chainlit/react-client';
import { ElementView } from '@chainlit/react-components';

import { useQuery } from 'hooks/query';

export default function Element() {
  const { id } = useParams();
  const query = useQuery();
  const { elements } = useChatData();

  const [element, setElement] = useState<IMessageElement | null>(null);
  const navigate = useNavigate();

  const threadId = query.get('thread');

  const { data, error } = useApi<IMessageElement>(
    apiClient,
    id && threadId ? `/project/thread/${threadId}/element/${id}` : null
  );

  useEffect(() => {
    if (data) {
      setElement(data);
    } else if (id && !threadId && !element) {
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
