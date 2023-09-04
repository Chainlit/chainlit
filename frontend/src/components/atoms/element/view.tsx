import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box, Typography } from '@mui/material';

import {
  AudioElement,
  FileElement,
  IMessageElement,
  ImageElement,
  PDFElement,
  VideoElement
} from '@chainlit/components';

import { useQuery } from 'hooks/query';
import { useApi } from 'hooks/useApi';

import { elementState } from 'state/element';

import TextElement from './text';

export const renderElement = (element: IMessageElement): JSX.Element | null => {
  switch (element.type) {
    case 'file':
      return <FileElement element={element} />;
    case 'image':
      return <ImageElement element={element} />;
    case 'text':
      return <TextElement element={element} />;
    case 'pdf':
      return <PDFElement element={element} />;
    case 'audio':
      return <AudioElement element={element} />;
    case 'video':
      return <VideoElement element={element} />;
  }
};

// TODO: Double check if we get the right element from API
const ElementView = () => {
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
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      p={3}
      gap={2}
      boxSizing="border-box"
      mx="auto"
      sx={{
        width: '100%',
        maxWidth: '60rem',
        color: 'text.primary'
      }}
      id="element-view"
    >
      <Typography fontWeight={700} fontSize="25px">
        {element.name}
      </Typography>
      {renderElement(element)}
    </Box>
  );
};

export default ElementView;
