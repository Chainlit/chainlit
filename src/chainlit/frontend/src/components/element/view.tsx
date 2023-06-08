import { Box, Typography } from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import {
  elementState,
  IElement,
  IImageElement,
  IPdfElement,
  ITextElement
} from 'state/element';
import TextElement from './text';
import ImageElement from './image';
import PDFElement from './pdf';

export const renderElement = (element: IElement): JSX.Element => {
  switch (element.type) {
    case 'image':
      return <ImageElement element={element as IImageElement} />;
    case 'text':
      return <TextElement element={element as ITextElement} />;
    case 'pdf':
      return <PDFElement element={element as IPdfElement} />;
  }
};

const ElementView = () => {
  const { id } = useParams();
  const elements = useRecoilValue(elementState);

  const element = elements.find(
    (element) => element.id == id || element.tempId == id
  );

  if (!element) {
    return <Navigate to="/" />;
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
        maxWidth: '60rem'
      }}
      id="element-view"
    >
      <Typography color="text.primary" fontWeight={700} fontSize="25px">
        {element.name}
      </Typography>
      {renderElement(element)}
    </Box>
  );
};

export default ElementView;
