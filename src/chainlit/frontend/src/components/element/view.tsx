import { Box, Typography } from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import {
  elementState,
  ElementType,
  IElement,
  IImageElement,
  ITextElement
} from 'state/element';
import TextElement from './text';
import ImageElement from './image';

export const renderElement = (element: IElement) => {
  switch (element.type) {
    case ElementType.img:
      return <ImageElement element={element as IImageElement} />;
    case ElementType.txt:
      return <TextElement element={element as ITextElement} />;
    default:
      return null;
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
