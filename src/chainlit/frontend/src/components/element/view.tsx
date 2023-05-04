import { Box } from '@mui/material';
import { Navigate, useParams } from 'react-router-dom';
import { useRecoilValue } from 'recoil';
import { elementState, ElementType, IElement } from 'state/element';
import TextElement from './text';

export const renderElement = (element: IElement) => {
  switch (element.type) {
    case ElementType.img:
      return (
        <img
          style={{
            marginTop: 0,
            width: '100%',
            borderRadius: '0.2rem',
            objectFit: 'cover'
          }}
          src={element.url || URL.createObjectURL(new Blob([element.content!]))}
        />
      );
    case ElementType.txt:
      return <TextElement element={element} />;
    default:
      return null;
  }
};

const ElementView = () => {
  const { name } = useParams();
  const elements = useRecoilValue(elementState);

  const element = elements[name!];

  if (!element) {
    return <Navigate to="/" />;
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      flexGrow={1}
      p={3}
      boxSizing="border-box"
      mx="auto"
      sx={{
        maxWidth: '60rem'
      }}
    >
      {renderElement(element)}
    </Box>
  );
};

export default ElementView;
