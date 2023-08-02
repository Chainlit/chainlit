import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';

import { Box, Typography } from '@mui/material';

import { useQuery } from 'hooks/query';

import { clientState } from 'state/client';
import { IMessageElement, elementState } from 'state/element';

import AudioElement from './audio';
import FileElement from './file';
import ImageElement from './image';
import PDFElement from './pdf';
import TextElement from './text';
import VideoElement from './video';

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

const ElementView = () => {
  const { id } = useParams();
  const query = useQuery();
  const elements = useRecoilValue(elementState);
  const client = useRecoilValue(clientState);
  const [element, setElement] = useState<IMessageElement | null>(null);
  const [error, setError] = useState<string | undefined>();

  const conversationId = query.get('conversation');

  useEffect(() => {
    if (!id) {
      return;
    }

    if (!conversationId) {
      const element = elements.find((element) => element.id === id);
      if (element) {
        setElement(element);
      }
    } else {
      client
        .getElement(conversationId, id)
        .then((element) => {
          setElement(element);
        })
        .catch((err) => {
          setError(err.message);
        });
    }
  }, [id, conversationId]);

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
