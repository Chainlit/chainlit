import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import {
  elementState,
  IAudioElement,
  IElement,
  IImageElement,
  IPdfElement,
  ITextElement
} from 'state/element';
import TextElement from './text';
import ImageElement from './image';
import PDFElement from './pdf';
import { useQuery } from 'hooks/query';
import { useEffect, useState } from 'react';
import { clientState } from 'state/client';
import AudioElement from './audio';

export const renderElement = (element: IElement): JSX.Element | null => {
  switch (element.type) {
    case 'image':
      return <ImageElement element={element as IImageElement} />;
    case 'text':
      return <TextElement element={element as ITextElement} />;
    case 'pdf':
      return <PDFElement element={element as IPdfElement} />;
    case 'audio':
      return <AudioElement element={element as IAudioElement} />;
    default:
      return null;
  }
};

const ElementView = () => {
  const { id } = useParams();
  const query = useQuery();
  const elements = useRecoilValue(elementState);
  const client = useRecoilValue(clientState);
  const [element, setElement] = useState<IElement | null>(null);
  const [error, setError] = useState<string | undefined>();

  const conversationId = query.get('conversation');

  useEffect(() => {
    if (!id) {
      return;
    }

    if (!conversationId) {
      const element = elements.find(
        (element) => element.id == Number(id) || element.tempId == id
      );
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
