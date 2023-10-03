import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import Page from 'pages/Page';

import { ElementView, IMessageElement, useChat } from '@chainlit/components';

import { useQuery } from 'hooks/query';
import { useApi } from 'hooks/useApi';

export default function Element() {
  const { id } = useParams();
  const query = useQuery();
  const { elements } = useChat();

  const [element, setElement] = useState<IMessageElement | null>(null);

  const conversationId = query.get('conversation');

  const { data, error } = useApi<IMessageElement>(
    id && conversationId
      ? `/project/conversation/${conversationId}/element/${id}`
      : null
  );

  useEffect(() => {
    if (data) {
      setElement(data);
    } else if (id && !conversationId && !element) {
      const foundElement = elements.find((element) => element.id === id);

      if (foundElement) {
        setElement(foundElement);
      }
    }
  }, [data, element, elements, id, conversationId]);

  if (!element || error) {
    return null;
  }

  return (
    <Page>
      <ElementView element={element} />
    </Page>
  );
}
