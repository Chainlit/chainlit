import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import Page from 'pages/Page';

import { ElementView, IMessageElement } from '@chainlit/components';

import { useQuery } from 'hooks/query';
import { useApi } from 'hooks/useApi';

import { elementState } from 'state/element';

export default function Element() {
  const { id } = useParams();
  const query = useQuery();

  const elements = useRecoilValue(elementState);
  const [element, setElement] = useState<IMessageElement | null>(null);

  const conversationId = query.get('conversation');

  const { data, error } = useApi<IMessageElement>(
    id && conversationId
      ? `/project/conversation/${conversationId}/element/${id}`
      : null
  );

  if (data) {
    setElement(data);
  } else if (id && !conversationId && !element) {
    const foundElement = elements.find((element) => element.id === id);

    if (foundElement) {
      setElement(foundElement);
    }
  }

  if (!element || error) {
    return null;
  }

  return (
    <Page>
      <ElementView element={element} />
    </Page>
  );
}
